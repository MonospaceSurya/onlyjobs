// File: app/(root)/question/[id]/page.tsx

import Answer from '@/components/forms/Answer';
import AllAnswers from '@/components/shared/AllAnswers';
import Metric from '@/components/shared/Metric';
import ParseHTML from '@/components/shared/ParseHTML';
import RenderTag from '@/components/shared/RenderTag';
import Votes from '@/components/shared/Votes';
import { getQuestionById } from '@/lib/actions/question.action';
import { getUserById } from '@/lib/actions/user.action';
import { formatAndDivideNumber, getTimestamp } from '@/lib/utils';
import { auth } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { notFound } from 'next/navigation'; // Import notFound

// Define expected params and searchParams structure for better type safety
interface PageProps {
    params: { id: string };
    searchParams: { [key: string]: string | undefined };
}

const Page = async ({ params, searchParams }: PageProps) => {
    // --- Authentication & User Fetching ---
    const { userId: clerkId } = auth(); // Get Clerk ID (null if not logged in)
    let mongoUser = null; // Initialize user from *your* DB to null

    if (clerkId) {
        try {
            // Fetch user from your DB only if logged in via Clerk
            mongoUser = await getUserById({ userId: clerkId });
            // mongoUser might still be null here if the webhook hasn't processed yet
            // or if there was an issue during its processing.
        } catch (error) {
            console.error(`Failed to fetch MongoDB user for clerkId ${clerkId}:`, error);
            // Decide how to handle this - perhaps proceed as if logged out, or show an error
            // For now, we'll proceed with mongoUser as null.
        }
    }

    // --- Question Fetching ---
    let result;
    try {
        result = await getQuestionById({ questionId: params.id });
    } catch (error) {
        console.error(`Failed to fetch question with ID ${params.id}:`, error);
        // If fetching the question fails, trigger 404
        notFound();
    }

    // If question is not found after fetch attempt, trigger 404
    if (!result) {
        console.log(`Question with ID ${params.id} not found.`);
        notFound();
    }

    // --- Prepare Data Safely for Rendering ---
    // Safely get the MongoDB user ID (_id) if mongoUser exists, otherwise null
    const mongoUserId = mongoUser?._id ?? null;

    // Check if the current user (if logged in and exists in DB) has performed actions
    // Use optional chaining on `mongoUser` before accessing `_id`
    const hasUserUpvoted = mongoUser ? result.upvotes.includes(mongoUser._id) : false;
    const hasUserDownvoted = mongoUser ? result.downvotes.includes(mongoUser._id) : false;
    // Optional chaining on `mongoUser` is sufficient here as `includes` handles undefined gracefully
    const hasUserSaved = mongoUser?.saved.includes(result._id) ?? false; // Default to false if mongoUser is null

    // Safely get author details with fallbacks
    const authorName = result.author?.name || 'Anonymous';
    const authorPicture = result.author?.picture || '/assets/icons/avatar.svg'; // Ensure default avatar exists
    const authorProfileLink = `/profile/${result.author?.clerkId || result.author?._id || 'unknown'}`; // Fallback for link


    // --- Render Page ---
    return (
        <>
            {/* Question Header & Votes */}
            <div className="flex-start w-full flex-col">
                <div className="flex w-full flex-col-reverse justify-between gap-5 sm:flex-row sm:items-center sm:gap-2">
                    <Link href={authorProfileLink} className="flex items-center justify-start gap-1">
                        <Image
                            src={authorPicture}
                            className="rounded-full"
                            width={22}
                            height={22}
                            alt={`${authorName}'s profile picture`}
                        />
                        <p className="paragraph-semibold text-dark300_light700">
                            {authorName}
                        </p>
                    </Link>
                    <div className="flex justify-end">
                        {/* Pass derived safe variables */}
                        <Votes
                            type="Question"
                            itemId={JSON.stringify(result._id)}
                            // Crucial: Pass the potentially null mongoUserId, correctly stringified
                            userId={JSON.stringify(mongoUserId)}
                            upvotes={result.upvotes.length}
                            hasupVoted={hasUserUpvoted}
                            downvotes={result.downvotes.length}
                            hasdownVoted={hasUserDownvoted}
                            hasSaved={hasUserSaved}
                        />
                    </div>
                </div>
                <h2 className="h2-semibold text-dark200_light900 mt-3.5 w-full text-left">
                    {result.title}
                </h2>
            </div>

            {/* Metrics */}
            <div className="mb-8 mt-5 flex flex-wrap gap-4">
                <Metric imgUrl="/assets/icons/clock.svg" alt="clock icon" value={` asked ${getTimestamp(result.createdAt)}`} title=" Asked" textStyles="small-medium text-dark400_light800" />
                <Metric imgUrl="/assets/icons/message.svg" alt="message" value={formatAndDivideNumber(result.answers.length)} title=" Answers" textStyles="small-medium text-dark400_light800" />
                <Metric imgUrl="/assets/icons/eye.svg" alt="eye" value={formatAndDivideNumber(result.views)} title=" Views" textStyles="small-medium text-dark400_light800" />
            </div>

            {/* Content */}
            <ParseHTML data={result.content} />

            {/* Tags */}
            <div className="mt-8 flex flex-wrap gap-2">
                {result.tags.map((tag: any) => (
                    <RenderTag key={tag._id} _id={tag._id} name={tag.name} showCount={false} />
                ))}
            </div>

            {/* Answers Section */}
            <AllAnswers
                questionId={result._id}
                userId={mongoUserId} // Pass potentially null user ID
                totalAnswers={result.answers.length}
                page={searchParams?.page ? parseInt(searchParams.page, 10) : 1} // Ensure page is a number
                filter={searchParams?.filter}
            />

            {/* Answer Form & Login Prompts */}
            <div className="mt-8">
                {mongoUser ? (
                    // Render Answer form only if user is logged in AND exists in our DB
                    <Answer
                        question={result.content}
                        questionId={JSON.stringify(result._id)}
                        authorId={JSON.stringify(mongoUserId)} // Safe because mongoUser exists here
                    />
                ) : clerkId ? (
                    // Logged in via Clerk, but not yet (or failed) in our DB
                    <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-yellow-700 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                        <p>Your user profile is syncing. You should be able to post answers shortly. Try refreshing in a moment.</p>
                        <p className="mt-2 text-sm">If this persists, please contact support.</p>
                    </div>
                ) : (
                    // Not logged in at all
                    <div className="rounded-md border border-blue-300 bg-blue-50 p-4 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        Please <Link href="/sign-in" className="font-semibold text-primary-500 underline hover:text-primary-700 dark:hover:text-primary-300">sign in</Link> or <Link href="/sign-up" className="font-semibold text-primary-500 underline hover:text-primary-700 dark:hover:text-primary-300">sign up</Link> to post an answer.
                    </div>
                )}
            </div>
        </>
    );
}

export default Page;