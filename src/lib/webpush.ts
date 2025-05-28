import webpush from 'web-push';

// Access environment variables for VAPID keys
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

// Store VAPID keys
let vapidKeys: { publicKey: string, privateKey: string };

// Check if VAPID keys are available in environment variables
if (!publicKey || !privateKey) {
  // Generate keys dynamically for development if not provided
  console.log('VAPID keys not found in environment variables, generating new ones...');
  vapidKeys = webpush.generateVAPIDKeys();
  
  console.log('Generated VAPID keys for development:');
  console.log('Public Key:', vapidKeys.publicKey);
  console.log('Private Key:', vapidKeys.privateKey);
  console.log('Add these to your .env file for production use');
} else {
  console.log('Using VAPID keys from environment variables');
  vapidKeys = {
    publicKey,
    privateKey
  };
}

// Configure web-push with your VAPID details
webpush.setVapidDetails(
  'mailto:support@example.com', // Change to your email
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export { webpush, vapidKeys };
