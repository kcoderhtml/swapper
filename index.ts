import { intro, log, outro } from '@clack/prompts';

type SlackProfile = {
    real_name: string;
    display_name: string;
    status_text: string;
    status_emoji: string;
    status_emoji_display_info: [];
    status_expiration: number;
    pronouns: string;
    first_name: string;
    last_name: string;
} | null;

type SlackToken = {
    ok: boolean;
    app_id: string;
    authed_user: {
        id: string;
        scope: string;
        access_token: string;
        token_type: string;
    };
    team: {
        id: string;
        name: string;
    };
    enterprise: {
        id: string;
        name: string;
    } | null;
    is_enterprise_install: boolean;
}

type Profile = {
    token: SlackToken;
    profile: SlackProfile;
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
    const tokenPromise = new Promise<SlackToken>(async (resolve, reject) => {
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
    profile = {
        token,
        profile: null
    };

    // grab user's profile
    log.info("Fetching user's profile...");
    const profileResponse = await fetch(`https://slack.com/api/users.profile.get`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${profile.token.authed_user.access_token}`,
        }
    });
    const profileData = await profileResponse.json();

    if (!profileData.ok) {
        log.error("Failed to fetch user's profile. Please try again.");
    }

    profile.profile = {
        real_name: profileData.profile.real_name,
        display_name: profileData.profile.display_name,
        status_text: profileData.profile.status_text,
        status_emoji: profileData.profile.status_emoji,
        status_emoji_display_info: profileData.profile.status_emoji_display_info,
        status_expiration: profileData.profile.status_expiration,
        pronouns: profileData.profile.pronouns,
        first_name: profileData.profile.first_name,
        last_name: profileData.profile.last_name,
    };

    // save profile
    await Bun.write('profile.json', JSON.stringify(profile));
    log.info("Profile saved successfully!");
}

if (profile && profile.profile && profile.token) {
    // confirm user is signed in and ready to swap
    log.message("You are signed in and ready to swap!");
    log.info(`Your current profile is:\nDisplay Name: ${profile.profile.display_name}\nID: ${profile.token.authed_user.id}`);
    // if profile is saved, ask if user wants to restore it
    const restoreProfile = await confirm("Would you like to restore your old profile?");
    if (restoreProfile) {
        // restore profile
        log.info("Restoring profile...");
        const restoreResponse = await fetch(`https://slack.com/api/users.profile.set`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${profile.token.authed_user.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                profile: profile.profile
            })
        });
        const restoreData = await restoreResponse.json();

        console.log(restoreData);

        if (!restoreData.ok) {
            log.error("Failed to restore profile. Please try again.");
        }

        log.info("Profile restored successfully!");
    }
    // else
    // choose user to swap with

    // confirm swap

    // swap

    // confirm swap completed

    // notify user that their old profile is saved
}
outro("Thanks for using Swapper! Have a great day!");