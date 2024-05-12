import { intro, log, outro } from '@clack/prompts';
import sharp from 'sharp';

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

    // get user's profile image
    const imageResponse = await fetch(profileData.profile.image_1024);

    // save profile
    await Bun.write('profile.json', JSON.stringify(profile));
    await Bun.write('profile-image.jpg', await imageResponse.arrayBuffer());
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

        const image = await Bun.file('profile-image.jpg');
        const formData = new FormData();
        formData.append('image', image);

        const imageResponse = await fetch(`https://slack.com/api/users.setPhoto`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${profile.token.authed_user.access_token}`,
            },
            body: formData
        });

        const imageResponseData = await imageResponse.json();

        if (!restoreData.ok || !imageResponseData.ok) {
            log.error("Failed to restore profile. Please try again.");
            console.log(restoreData, imageResponseData);
        }

        log.info("Profile restored successfully!");
    } else {
        // choose user to swap with
        const swapUser = await prompt("Please enter the ID of the user you would like to swap with:");
        // get user's profile
        log.info("Fetching user's profile...");
        const swapProfileResponse = await fetch(`https://slack.com/api/users.profile.get?user=${swapUser}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${profile.token.authed_user.access_token}`,
                'Content-Type': 'application/json'
            },
        });

        const swapProfileData = await swapProfileResponse.json();
        if (!swapProfileData.ok) {
            log.error("Failed to fetch user's profile. Please try again.");
        }

        const swapProfile: SlackProfile = {
            real_name: swapProfileData.profile.real_name,
            display_name: swapProfileData.profile.display_name,
            status_text: swapProfileData.profile.status_text,
            status_emoji: swapProfileData.profile.status_emoji,
            status_emoji_display_info: swapProfileData.profile.status_emoji_display_info,
            status_expiration: swapProfileData.profile.status_expiration,
            pronouns: swapProfileData.profile.pronouns,
            first_name: swapProfileData.profile.first_name,
            last_name: swapProfileData.profile.last_name,
        };

        // confirm swap
        log.info(`You are swapping with ${swapProfile.display_name}!`);
        const confirmSwap = await confirm("Are you sure you want to swap profiles?");
        if (!confirmSwap) {
            log.error("Swap cancelled. Please try again.");
        } else {
            // swap
            log.info("Swapping profiles...");
            const swapResponse = await fetch(`https://slack.com/api/users.profile.set`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${profile.token.authed_user.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    profile: swapProfile
                })
            });

            const swapResponseData = await swapResponse.json();

            // get user's profile image
            const imageResponse = await fetch(swapProfileData.profile.image_512)
            Bun.write('new-profile-image.jpg', await sharp(await imageResponse.arrayBuffer()).jpeg({ quality: 50 }).toBuffer());

            const formData = new FormData();
            const blob = await Bun.file('new-profile-image.jpg');
            formData.append('image', blob);

            const swapImageResponse = await fetch(`https://slack.com/api/users.setPhoto`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${profile.token.authed_user.access_token}`,
                },
                body: formData
            });

            const swapImageData = await swapImageResponse.json();

            if (!swapResponseData.ok || !swapImageData.ok) {
                log.error("Failed to swap profiles. Please try again.");
                console.log(swapResponseData, swapImageData);
            } else {
                // confirm swap completed
                log.info("Profile swapped successfully!");
            }

            // notify user that their old profile is saved
            log.info("Your old profile has been saved. You can restore it at any time by rerunning this program.");
        }
    }
}

outro("Thanks for using Swapper! Have a great day!");