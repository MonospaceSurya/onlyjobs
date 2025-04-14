/* eslint-disable camelcase */
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createUser, deleteUser, updateUser } from '@/lib/actions/user.action';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.NEXT_CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('MISSING WEBHOOK_SECRET'); // Add specific log
    // It's critical this is set, throw an error or return a clear server error
    return new NextResponse('Webhook secret not configured', { status: 500 });
    // Or: throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Webhook Error: Missing Svix headers'); // Add specific log
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new SVIX instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    // Provide a more informative error message if verification fails
    return new Response('Error occured verifying webhook signature', {
      status: 400
    });
  }

  // Get the type of event
  const eventType = evt.type;

  console.log(`Webhook received: ${eventType}`); // Log received event type

  // --------------------------------------------
  // Handle the 'user.created' event (SIGN UP)
  // --------------------------------------------
  if (eventType === 'user.created') {
    const { id, email_addresses, image_url, username, first_name, last_name } = evt.data;

    // Basic validation for required fields from Clerk
    if (!id || !email_addresses || email_addresses.length === 0 || !email_addresses[0].email_address || !image_url) {
       console.error('Webhook Error: Missing required data for user.created event.', { data: evt.data });
       return NextResponse.json({ message: 'Error: Missing required user data from webhook' }, { status: 400 });
    }

    // Username might be optional depending on Clerk settings, handle gracefully
    const actualUsername = username || `${first_name}${last_name}` || `user_${id.substring(id.length - 6)}`; // Generate a fallback username if needed

    try {
      // Create the user in your MongoDB database
      const mongoUser = await createUser({
        clerkId: id,
        // Handle potential null/undefined names, fallback to username
        name: (`${first_name || ''} ${last_name || ''}`).trim() || actualUsername,
        username: actualUsername!, // Use the potentially generated username
        email: email_addresses[0].email_address, // Use the primary email
        picture: image_url,
      });

      console.log('Webhook: User created successfully in DB:', mongoUser._id);
      // Return a success response
      return NextResponse.json({ message: 'OK, user created', user: mongoUser }, { status: 201 }); // Use 201 for created resource

    } catch (dbError: any) {
      console.error('Webhook Error: Failed to create user in DB:', dbError);
      // Check for duplicate key errors (e.g., unique username/email constraint)
      if (dbError.code === 11000) {
        return NextResponse.json({ message: 'Error: User with this email or username might already exist.' }, { status: 409 }); // Conflict
      }
      // Return a generic server error for other database issues
      return NextResponse.json({ message: 'Error creating user in database' }, { status: 500 });
    }
  }

  // --------------------------------------------
  // Handle the 'user.updated' event
  // --------------------------------------------
  if (eventType === 'user.updated') {
     const { id, email_addresses, image_url, username, first_name, last_name } = evt.data;

      // Basic validation
      if (!id || !email_addresses || email_addresses.length === 0 || !email_addresses[0].email_address || !image_url) {
        console.error('Webhook Error: Missing required data for user.updated event.', { data: evt.data });
        return NextResponse.json({ message: 'Error: Missing required user data for update' }, { status: 400 });
      }
      const actualUsername = username || `${first_name}${last_name}` || `user_${id.substring(id.length - 6)}`;

     try {
        // Update the user in MongoDB
        const mongoUser = await updateUser({
          clerkId: id,
          updateData: {
            name: (`${first_name || ''} ${last_name || ''}`).trim() || actualUsername,
            username: actualUsername!,
            email: email_addresses[0].email_address,
            picture: image_url,
          },
          path: `/profile/${id}` // Revalidate the profile page
        });
        console.log('Webhook: User updated successfully in DB:', id);
        return NextResponse.json({ message: 'OK, user updated', user: mongoUser }, { status: 200 });
     } catch (dbError) {
        console.error('Webhook Error: Failed to update user in DB:', dbError);
        return NextResponse.json({ message: 'Error updating user in database' }, { status: 500 });
     }
  }

  // --------------------------------------------
  // Handle the 'user.deleted' event
  // --------------------------------------------
  if (eventType === 'user.deleted') {
    const { id, deleted } = evt.data; // Clerk's deleted event might include a 'deleted: true' flag

    // Check if ID exists
    if (!id) {
       console.error('Webhook Error: Missing id for user.deleted event.');
       return NextResponse.json({ message: 'Error: Missing user id for deletion' }, { status: 400 });
    }

    // Optional: Double-check the 'deleted' flag if available
    // if (!deleted) {
    //    console.warn('Webhook Warning: Received user.deleted event but deleted flag is not true.', { data: evt.data });
    //    // Decide how to handle this - maybe still attempt deletion or just log
    // }

    try {
        // Delete the user from MongoDB
        const deletedUser = await deleteUser({
            clerkId: id!, // Use non-null assertion as we checked for id
        });

        // Check if the user was actually found and deleted
        if (!deletedUser) {
            console.warn(`Webhook Warning: User with clerkId ${id} not found in DB for deletion.`);
            return NextResponse.json({ message: 'User not found in database' }, { status: 404 });
        }

        console.log('Webhook: User deleted successfully from DB:', id);
        return NextResponse.json({ message: 'OK, user deleted', user: deletedUser }, { status: 200 });
    } catch (dbError) {
        console.error('Webhook Error: Failed to delete user from DB:', dbError);
        return NextResponse.json({ message: 'Error deleting user from database' }, { status: 500 });
    }
  }

  // If the event type isn't handled, respond with OK status
  console.log(`Webhook: Event type ${eventType} received but not explicitly handled.`);
  return NextResponse.json({ message: 'Webhook received' }, { status: 200 });
}