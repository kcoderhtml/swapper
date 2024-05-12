import { intro, log, outro, text } from '@clack/prompts';
import Elysia from 'elysia';

type Profile = {
    name: string;
    token: string;
};

intro("Welcome to Swapper -- the slack tool to serve your every prankster need!");

// sign user in
// check if user has a saved profile from a previous swap
let profile: Profile | null = null;
try {
    const profileData = await Bun.file('profile.json').text();
    profile = JSON.parse(profileData);

    if (!profile) {
        throw new Error();
    }

    log.info("Profile data loaded successfully!");
} catch (error) {
    if (error instanceof Error) {
        log.error("Profile data is corrupted or doesn't exist. Please sign in again.");
    }
}

if (!profile) {
    // sign user in
    log.info("Signing user in...");
    // sign in user with slack oauth
    log.info(`Please sign in with slack to continue...\nhttps://slack.com/oauth/v2/authorize?scope=&user_scope=users.profile%3Aread%2Cusers.profile%3Awrite&redirect_uri=http%3A%2F%2Flocalhost%3A7734&client_id=${process.env.SLACK_CLIENT_ID}`);

    // listen for slack oauth response
    const tokenPromise = new Promise<string>(async (resolve, reject) => {
        const server = Bun.serve(
            {
                async fetch(req: Request): Promise<Response> {
                    const url = new URL(req.url);
                    const code = url.searchParams.get('code');
                    if (!code) {
                        return new Response("Invalid code provided. Please try again.");
                    }

                    // get token from slack
                    const response = await fetch(`https://slack.com/api/oauth.v2.access?code=${code}&client_id=${process.env.SLACK_CLIENT_ID}&client_secret=${process.env.SLACK_CLIENT_SECRET}&redirect_uri=http%3A%2F%2Flocalhost%3A7734`);
                    const data = await response.json();
                    if (!data.ok) {
                        return new Response("Failed to sign in. Please try again.");
                    }

                    server.stop();
                    resolve(data);
                    return new Response("You can close this tab now!");
                },
                port: 7734,
            }
        );
    });

    const token = await tokenPromise;

    log.info("User signed in successfully!");
    console.log(token);
}

// confirm user is signed in and ready to swap

// if profile is saved, ask if user wants to restore it

// else
// choose user to swap with

// confirm swap

// swap

// confirm swap completed

// notify user that their old profile is saved

outro("Thanks for using Swapper! Have a great day!");