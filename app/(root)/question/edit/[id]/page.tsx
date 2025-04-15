// File: app/(root)/question/edit/[id]/page.tsx

import Question from '@/components/forms/Question';
import { getQuestionById } from '@/lib/actions/question.action';
import { getUserById } from '@/lib/actions/user.action';
import { ParamsProps } from '@/types';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation'; // Import redirect

const Page = async ({ params }: ParamsProps) => {
    const { userId: clerkId } = auth(); // Get Clerk ID

    // --- Step 1: Check if user is logged in via Clerk ---
    if (!clerkId) {
        // If not logged in, redirect to sign-in page
        redirect('/sign-in');
    }

    // --- Step 2: Fetch user data from *your* database ---
    // It's possible getUserById returns null if webhook failed/delayed
    const mongoUser = await getUserById({ userId: clerkId });

    // --- Step 3: Check if user exists in *your* database ---
    if (!mongoUser) {
        // Option 1: Redirect if user not found in DB (maybe webhook issue)
        // redirect('/'); // Redirect home or show an error

        // Option 2: Throw an error to show Next.js error page
         throw new Error("User profile not found in database. Cannot edit question.");

        // Option 3: Return a specific message component (less common for edits)
        // return <div>Error: Your user profile could not be loaded. Please try again later.</div>;
    }

    // --- Step 4: Fetch the question details ---
    // Add try-catch for robustness
    let result;
    try {
       result = await getQuestionById({ questionId: params.id });
    } catch (error) {
        console.error("Failed to fetch question for editing:", error);
        throw new Error("Could not load question details for editing.");
    }

    // --- Step 5: Check if question exists ---
    if (!result) {
        throw new Error("Question not found."); // Or use notFound() from next/navigation
    }

    // --- Step 6: Authorization Check (Optional but Recommended) ---
    // Ensure the logged-in user is the author of the question
    // Note: Comparing Clerk IDs is usually more reliable if available on the question author object
    const isAuthor = result.author?.clerkId === clerkId || result.author?._id.toString() === mongoUser._id.toString();
    if (!isAuthor) {
        // If not the author, redirect or throw forbidden error
        // redirect('/'); // Or redirect to the question view page
        throw new Error("You are not authorized to edit this question.");
    }


    // --- Step 7: Render the form ONLY if all checks pass ---
    // mongoUser is guaranteed to exist here because of the check above
    return (
        <>
            <h1 className="h1-bold text-dark100_light900">Edit Question</h1>

            <div className="mt-9">
                <Question
                    type="Edit"
                    // Pass the confirmed mongoUser._id
                    mongoUserId={mongoUser._id.toString()} // Pass as string if component expects string
                    questionDetails={JSON.stringify(result)}
                />
            </div>
        </>
    );
}

export default Page;