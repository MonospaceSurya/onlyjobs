// File: lib/actions/user.action.ts

"use server";

import { FilterQuery } from "mongoose";
import User, { IUser } from "@/database/user.model"; // Ensure IUser is imported
import { connectToDatabase } from "../mongoose";
import {
    CreateUserParams,
    DeleteUserParams,
    GetAllUsersParams,
    GetSavedQuestionsParams,
    GetUserByIdParams,
    GetUserStatsParams,
    ToggleSaveQuestionParams,
    UpdateUserParams,
} from "./shared.types";
import { revalidatePath } from "next/cache";
import Question from "@/database/question.model";
import Tag from "@/database/tag.model";
import Answer from "@/database/answer.model";
import { BadgeCriteriaType } from "@/types";
import { assignBadges } from "../utils";
// import Interaction from "@/database/interaction.model";

// --- Get User by Clerk ID ---
export async function getUserById(params: GetUserByIdParams): Promise<IUser | null> {
    try {
        await connectToDatabase();
        const { userId } = params;
        const user = await User.findOne({ clerkId: userId });
        return user;
    } catch (error) {
        console.error(`Error fetching user by Clerk ID ${params.userId}:`, error);
        throw error;
    }
}

// --- Create User ---
export async function createUser(userData: CreateUserParams): Promise<IUser> {
    try {
        await connectToDatabase();
        const newUser = await User.create(userData);
        console.log(`[createUser] New user created in DB: ${newUser._id} for Clerk ID: ${userData.clerkId}`);
        return newUser;
    } catch (error) {
        console.error(`Error creating user for Clerk ID ${userData.clerkId}:`, error);
        throw error;
    }
}

// --- Update User ---
export async function updateUser(params: UpdateUserParams): Promise<IUser | null> {
    try {
        await connectToDatabase();
        const { clerkId, updateData, path } = params;
        const updatedUser = await User.findOneAndUpdate({ clerkId }, updateData, { new: true });
        if (!updatedUser) {
            console.warn(`[updateUser] User with Clerk ID ${clerkId} not found for update.`);
        } else {
            console.log(`[updateUser] User updated successfully for Clerk ID: ${clerkId}`);
            revalidatePath(path);
        }
        return updatedUser;
    } catch (error) {
        console.error(`Error updating user for Clerk ID ${params.clerkId}:`, error);
        throw error;
    }
}

// --- Delete User (Refactored Find-Then-Delete Logic) ---
export async function deleteUser(params: DeleteUserParams): Promise<IUser | null> {
    try {
        await connectToDatabase();
        const { clerkId } = params;

        // Step 1: Find the user document first using clerkId.
        const userToDelete: IUser | null = await User.findOne({ clerkId });

        // Step 2: Check if the user exists.
        if (!userToDelete) {
            console.warn(`[deleteUser] User with Clerk ID ${clerkId} not found in DB. Cannot delete.`);
            return null; // Return null as no user was found/deleted.
        }

        // Step 3: User exists. Get their MongoDB _id.
        const userIdMongo = userToDelete._id;
        console.log(`[deleteUser] Found user to delete (Clerk ID: ${clerkId}, Mongo ID: ${userIdMongo}). Proceeding with deletion and cleanup.`);

        // Step 4: Delete the user using their specific MongoDB _id.
        // We don't strictly *need* the result of this operation anymore,
        // as we already have the user document in `userToDelete`.
        await User.findByIdAndDelete(userIdMongo);

        // Step 5: Perform cleanup using the MongoDB _id.
        console.log(` > Starting cleanup for associated data...`);
        // Delete associated Questions
        const questionDelResult = await Question.deleteMany({ author: userIdMongo });
        console.log(` > Deleted ${questionDelResult.deletedCount} question(s).`);

        // Delete associated Answers
        const answerDelResult = await Answer.deleteMany({ author: userIdMongo });
        console.log(` > Deleted ${answerDelResult.deletedCount} answer(s).`);

        // TODO: Add cleanup for Interactions, Comments, Votes etc. using userIdMongo
        // const interactionDelResult = await Interaction.deleteMany({ user: userIdMongo });
        // console.log(` > Deleted ${interactionDelResult.deletedCount} interaction(s).`);

        console.log(`[deleteUser] Successfully deleted user (Clerk ID: ${clerkId}) and finished cleanup.`);

        // Step 6: Return the document of the user that was found *before* deletion.
        return userToDelete;

    } catch (error) {
        console.error(`Error during user deletion process for clerkId ${params.clerkId}:`, error);
        throw error; // Propagate the error
    }
}


// --- Get All Users ---
export async function getAllUsers(params: GetAllUsersParams) {
    try {
        await connectToDatabase();
        const { searchQuery, filter, page = 1, pageSize = 10 } = params;
        const skipAmount = (page - 1) * pageSize;

        const query: FilterQuery<typeof User> = {};
        if (searchQuery) {
            const escapedSearchQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedSearchQuery, 'i');
            query.$or = [{ name: regex }, { username: regex }];
        }

        let sortOptions: any = { joinedAt: -1 };
        switch (filter) {
            case "new_users": sortOptions = { joinedAt: -1 }; break;
            case "old_users": sortOptions = { joinedAt: 1 }; break;
            case "top_contributors": sortOptions = { reputation: -1 }; break;
        }

        const users = await User.find(query)
            .select('-password')
            .sort(sortOptions)
            .skip(skipAmount)
            .limit(pageSize);

        const totalUsers = await User.countDocuments(query);
        const isNext = totalUsers > skipAmount + users.length;

        return { users, isNext };
    } catch (error) {
        console.error("Error fetching all users:", error);
        throw error;
    }
}

// --- Toggle Save Question ---
export async function toggleSaveQuestion(params: ToggleSaveQuestionParams): Promise<void> {
    try {
        await connectToDatabase();
        const { userId, questionId, path } = params; // userId is MongoDB _id

        const user = await User.findById(userId);
        if (!user) throw new Error(`User with ID ${userId} not found to toggle save.`);

        const isQuestionSaved = user.saved.includes(questionId);
        const updateOperation = isQuestionSaved
            ? { $pull: { saved: questionId } }
            : { $addToSet: { saved: questionId } };

        await User.findByIdAndUpdate(userId, updateOperation);
        console.log(`[toggleSaveQuestion] ${isQuestionSaved ? 'Removed' : 'Added'} Q:${questionId} ${isQuestionSaved ? 'from' : 'to'} User:${userId}'s saved list.`);
        revalidatePath(path);

    } catch (error) {
        console.error(`Error toggling save for Q:${params.questionId}, User:${params.userId}:`, error);
        throw error;
    }
}

// --- Get Saved Questions ---
export async function getSavedQuestions(params: GetSavedQuestionsParams) {
    try {
        await connectToDatabase();
        const { clerkId, searchQuery, filter, page = 1, pageSize = 10 } = params;
        const skipAmount = (page - 1) * pageSize;

        const user = await User.findOne({ clerkId }).select('saved');
        if (!user) {
            console.warn(`[getSavedQuestions] User not found for Clerk ID: ${clerkId}. Returning empty list.`);
            return { questions: [], isNext: false };
        }

        const savedQuestionBaseQuery: FilterQuery<typeof Question> = { _id: { $in: user.saved } };
        const query: FilterQuery<typeof Question> = searchQuery
            ? { ...savedQuestionBaseQuery, title: { $regex: new RegExp(searchQuery, 'i') } }
            : savedQuestionBaseQuery;

        let sortOptions: any = { createdAt: -1 };
        switch (filter) {
            case "most_recent": sortOptions = { createdAt: -1 }; break;
            case "oldest": sortOptions = { createdAt: 1 }; break;
            case "most_voted": sortOptions = { upvotes: -1 }; break;
            case "most_viewed": sortOptions = { views: -1 }; break;
            case "most_answered": sortOptions = { answers: -1 }; break;
        }

        const totalSavedQuestions = await Question.countDocuments(query);
        const savedQuestions = await Question.find(query)
            .populate({ path: 'tags', model: Tag, select: "_id name" })
            .populate({ path: 'author', model: User, select: '_id clerkId name picture' })
            .sort(sortOptions)
            .skip(skipAmount)
            .limit(pageSize);

        const isNext = totalSavedQuestions > (skipAmount + savedQuestions.length);

        return { questions: savedQuestions, isNext };
    } catch (error) {
        console.error(`Error fetching saved questions for Clerk ID ${params.clerkId}:`, error);
        throw error;
    }
}


// --- Get User Info ---
export async function getUserInfo(params: GetUserByIdParams) {
    try {
        await connectToDatabase();
        const { userId } = params; // Expecting Clerk ID

        const user = await User.findOne({ clerkId: userId });

        if (!user) {
            console.error(`[getUserInfo] User not found in MongoDB for Clerk ID: ${userId}.`);
            throw new Error(`User profile data not found.`);
        }

        const userMongoId = user._id;
        const [totalQuestions, totalAnswers, questionUpvotesData, answerUpvotesData, questionViewsData] = await Promise.all([
            Question.countDocuments({ author: userMongoId }),
            Answer.countDocuments({ author: userMongoId }),
            Question.aggregate([
                { $match: { author: userMongoId } },
                { $project: { _id: 0, count: { $size: { $ifNull: ["$upvotes", []] } } } },
                { $group: { _id: null, totalUpvotes: { $sum: "$count" } } }
            ]),
            Answer.aggregate([
                { $match: { author: userMongoId } },
                { $project: { _id: 0, count: { $size: { $ifNull: ["$upvotes", []] } } } },
                { $group: { _id: null, totalUpvotes: { $sum: "$count" } } }
            ]),
            Question.aggregate([
                { $match: { author: userMongoId } },
                { $group: { _id: null, totalViews: { $sum: { $ifNull: ["$views", 0] } } } }
            ])
        ]);

        const criteria = [
            { type: 'QUESTION_COUNT' as BadgeCriteriaType, count: totalQuestions },
            { type: 'ANSWER_COUNT' as BadgeCriteriaType, count: totalAnswers },
            { type: 'QUESTION_UPVOTES' as BadgeCriteriaType, count: questionUpvotesData[0]?.totalUpvotes || 0 },
            { type: 'ANSWER_UPVOTES' as BadgeCriteriaType, count: answerUpvotesData[0]?.totalUpvotes || 0 },
            { type: 'TOTAL_VIEWS' as BadgeCriteriaType, count: questionViewsData[0]?.totalViews || 0 },
        ];
        const badgeCounts = assignBadges({ criteria });

        return {
            user,
            totalQuestions,
            totalAnswers,
            badgeCounts,
            reputation: user.reputation ?? 0,
        };
    } catch (error) {
        console.error(`Error fetching user info for Clerk ID ${params.userId}:`, error);
        throw error;
    }
}

// --- Get User Questions ---
export async function getUserQuestions(params: GetUserStatsParams) {
    try {
        await connectToDatabase();
        const { userId, page = 1, pageSize = 10 } = params; // userId is MongoDB _id
        if (!userId) throw new Error("MongoDB User ID is required for getUserQuestions.");
        const skipAmount = (page - 1) * pageSize;

        const [totalQuestions, userQuestions] = await Promise.all([
             Question.countDocuments({ author: userId }),
             Question.find({ author: userId })
                .sort({ createdAt: -1 })
                .skip(skipAmount)
                .limit(pageSize)
                .populate('tags', '_id name')
                .populate('author', '_id clerkId name picture')
        ]);
        const isNextQuestions = totalQuestions > skipAmount + userQuestions.length;
        return { totalQuestions, questions: userQuestions, isNextQuestions };
    } catch (error) {
        console.error(`Error fetching questions for Mongo User ID ${params.userId}:`, error);
        throw error;
    }
}

// --- Get User Answers ---
export async function getUserAnswers(params: GetUserStatsParams) {
    try {
        await connectToDatabase();
        const { userId, page = 1, pageSize = 10 } = params; // userId is MongoDB _id
        if (!userId) throw new Error("MongoDB User ID is required for getUserAnswers.");
        const skipAmount = (page - 1) * pageSize;

        const [totalAnswers, userAnswers] = await Promise.all([
            Answer.countDocuments({ author: userId }),
            Answer.find({ author: userId })
                .sort({ upvotes: -1 })
                .skip(skipAmount)
                .limit(pageSize)
                .populate('question', '_id title')
                .populate('author', '_id clerkId name picture')
        ]);
        const isNextAnswer = totalAnswers > skipAmount + userAnswers.length;
        return { totalAnswers, answers: userAnswers, isNextAnswer };
    } catch (error) {
        console.error(`Error fetching answers for Mongo User ID ${params.userId}:`, error);
        throw error;
    }
}