// File: app/api/webhook/route.ts

/* eslint-disable camelcase */
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createUser, deleteUser, updateUser } from '@/lib/actions/user.action'; // Ensure these actions exist and work
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // --- Check for Webhook Secret ---
  const WEBHOOK_SECRET = process.env.NEXT_CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error('CRITICAL ERROR: NEXT_CLERK_WEBHOOK_SECRET is not set in environment variables.');
    return new NextResponse('Webhook secret not configured on server.', { status: 500 });
  }

  // --- Get Svix Headers ---
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Webhook Error: Missing required Svix headers.');
    return new Response('Error: Missing Svix headers', { status: 400 });
  }

  // --- Read and Verify Payload ---
  let payload;
  let body;
  try {
    payload = await req.json();
    body = JSON.stringify(payload);
  } catch (error) {
    console.error('Webhook Error: Could not parse request body as JSON.', error);
    return new Response('Error: Invalid JSON body', { status: 400 });
  }

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err: any) {
    console.error('Webhook Error: Signature verification failed.', {
      errorMessage: err.message,
      svix_id,
      svix_timestamp,
    });
    return new Response('Error: Webhook signature verification failed', { status: 400 });
  }

  // --- Process Verified Event ---
  const eventType = evt.type;
  const eventId = 'id' in evt.data ? evt.data.id : 'N/A'; // Safely access potential ID
  console.log(`Webhook Received: Event Type = ${eventType}, Clerk User/Event ID = ${eventId}`);


  // ============================================================
  // THIS IS THE BLOCK THAT HANDLES NEW USER SIGNUPS
  // ============================================================
  if (eventType === 'user.created') {
    // Destructure data from the event payload
    const { id, email_addresses, image_url, username, first_name, last_name } = evt.data;

    // Validate essential data received from Clerk
    if (!id || !email_addresses || email_addresses.length === 0 || !email_addresses[0].email_address || !image_url) {
       console.error(`Webhook Error (user.created) for Clerk ID ${id || 'UNKNOWN'}: Missing essential user data in webhook payload.`, { receivedData: evt.data });
       return NextResponse.json({ message: 'Error: Missing required user data from webhook' }, { status: 400 });
    }

    // Prepare data for your database schema
    const primaryEmail = email_addresses[0].email_address;
    // Generate a fallback username if Clerk doesn't provide one or if it's null/empty
    const actualUsername = username || `${first_name || ''}${last_name || ''}`.replace(/\s+/g, '').toLowerCase() || `user_${id.substring(id.length - 6)}`;
    const actualName = (`${first_name || ''} ${last_name || ''}`).trim() || actualUsername; // Fallback name to username

    // Data to be saved in MongoDB
    const userDataForDB = {
        clerkId: id,
        name: actualName,
        username: actualUsername,
        email: primaryEmail,
        picture: image_url,
    };

    try {
      console.log(`Webhook (user.created): Attempting to create user in DB with data:`, userDataForDB);
      // Call the action function to create the user in MongoDB
      const mongoUser = await createUser(userDataForDB);

      console.log(`Webhook (user.created): Successfully created user in DB. MongoDB ID: ${mongoUser._id}, Clerk ID: ${id}`);
      // Respond to Clerk with success (201 Created)
      return NextResponse.json({ message: 'OK, user created', user: mongoUser }, { status: 201 });

    } catch (dbError: any) {
      console.error(`Webhook Error (user.created): Failed to create user in DB for Clerk ID: ${id}. Error:`, dbError);
      // Handle potential duplicate key errors (MongoDB code 11000)
      if (dbError.code === 11000) {
        console.error(`Webhook Error (user.created): Duplicate key error. Details: ${dbError.message}`);
        // Respond with 409 Conflict
        return NextResponse.json({ message: 'Error: User with this email or username likely already exists.' }, { status: 409 });
      }
      // Generic server error for other DB issues
      return NextResponse.json({ message: 'Internal server error while creating user in database.' }, { status: 500 });
    }
  }
  // ============================================================
  // END OF user.created HANDLING
  // ============================================================


  // --- Handle 'user.updated' ---
  if (eventType === 'user.updated') {
     // ... (Your existing robust user update logic here) ...
     const { id, email_addresses, image_url, username, first_name, last_name } = evt.data;
      if (!id || !email_addresses || email_addresses.length === 0 || !email_addresses[0].email_address || !image_url) {
        console.error('Webhook Error (user.updated): Missing essential user data.', { receivedData: evt.data });
        return NextResponse.json({ message: 'Error: Missing required user data for update' }, { status: 400 });
      }
     const primaryEmail = email_addresses[0].email_address;
     const actualUsername = username || `${first_name || ''}${last_name || ''}`.replace(/\s+/g, '').toLowerCase() || `user_${id.substring(id.length - 6)}`;
     const actualName = (`${first_name || ''} ${last_name || ''}`).trim() || actualUsername;
     const updateDataForDB = {
            name: actualName,
            username: actualUsername,
            email: primaryEmail,
            picture: image_url,
          };
     try {
        console.log(`Webhook (user.updated): Attempting to update user in DB for Clerk ID: ${id} with data:`, updateDataForDB);
        const mongoUser = await updateUser({
          clerkId: id,
          updateData: updateDataForDB,
          path: `/profile/${id}`
        });
        console.log(`Webhook (user.updated): Successfully updated user in DB for Clerk ID: ${id}`);
        return NextResponse.json({ message: 'OK, user updated', user: mongoUser }, { status: 200 });
     } catch (dbError: any) {
        console.error(`Webhook Error (user.updated): Failed to update user in DB for Clerk ID: ${id}. Error:`, dbError);
        return NextResponse.json({ message: 'Internal server error while updating user.' }, { status: 500 });
     }
  }

  // --- Handle 'user.deleted' ---
  if (eventType === 'user.deleted') {
    // ... (Your existing robust user delete logic here) ...
    const { id, deleted } = evt.data;
    if (!id) {
       console.error('Webhook Error (user.deleted): Missing user ID.');
       return NextResponse.json({ message: 'Error: Missing user id for deletion' }, { status: 400 });
    }
     if (deleted === false) { console.warn(`Webhook Warning (user.deleted): Received event for Clerk ID ${id}, but 'deleted' flag is false.`); }
    try {
        console.log(`Webhook (user.deleted): Attempting to delete user from DB for Clerk ID: ${id}`);
        const deletedUser = await deleteUser({ clerkId: id });
        if (!deletedUser) {
            console.warn(`Webhook Warning (user.deleted): User with Clerk ID ${id} not found in DB during deletion attempt.`);
             return NextResponse.json({ message: 'OK, user not found or already deleted' }, { status: 200 });
        }
        console.log(`Webhook (user.deleted): Successfully deleted user from DB for Clerk ID: ${id}`);
        return NextResponse.json({ message: 'OK, user deleted', user: deletedUser }, { status: 200 });
    } catch (dbError: any) {
        console.error(`Webhook Error (user.deleted): Failed to delete user from DB for Clerk ID: ${id}. Error:`, dbError);
        return NextResponse.json({ message: 'Internal server error while deleting user.' }, { status: 500 });
    }
  }

  // --- Acknowledge other event types ---
  console.log(`Webhook: Event type ${eventType} received but not explicitly handled.`);
  return NextResponse.json({ message: 'Webhook received and acknowledged.' }, { status: 200 });
}