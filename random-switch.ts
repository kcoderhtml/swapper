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

const slackUserIds = [
    "U01MPHKFZ7S",
    "U021VLF7880",
    "U05QJ4CF5QT",
    "U05NX48GL3T",
    "U05KCRSJXH9",
    "U04KEK4TS72",
    "U04QD71QWS0",
    "U04JGJN2B40",
    "U050RGDU8NN",
    "U03RU99SGKA",
    "U05F4B48GBF",
    "U014ND5P1N2",
    "U04G40QKAAD",
    "UDK5M9Y13",
    "U04CBLNSVH6",
    "U060YRK2734",
    "U041FQB8VK2",
    "U01FAVARYH1",
    "U029D5FG8EN",
    "U04QH1TTMBP",
    "U01581HFAGZ",
    "U05FHGVJ3U7",
    "U0C7B14Q3",
    "U06L79991V0",
    "U0261EB1EG7",
    "U016S3C7JS2",
    "U0162MDUP7C",
    "U055092HPMZ",
    "U066LL4JBDL",
    "U014E8132DB",
    "U02UYFZQ0G0",
    "U0409FSKU82",
    "U04FMKCVASJ",
    "U022XFD2TML",
    "USNPNJXNX",
    "U06T766UHGA",
    "U03K9LZ3AE6",
    "U0266FRGP",
    "U03UBRVG2MS",
    "U05RFBS4BEW",
    "U043Q05KFAA",
    "U01PJ08PR7S",
    "U01QHUY5XLK",
    "U0511S72BHP",
    "U054VC2KM9P",
    "U06FG6G6SNL",
    "U015MCCBXBP",
    "U06QK6AG3RD",
    "U070B8A2BTR",
    "UT2E7L19C",
    "U02QN9S567M",
    "U05RGF25HN0",
    "U0616280E6P",
    "U062UG485EE",
    "U056J6JURFF",
    "U03MNFDRSGJ",
    "U04GECG3H8W",
    "U05PYFCJXV0",
    "U04FWSU0U4B",
    "U06FMCCDS1K",
    "U02CWS020SD",
    "U06HPP9GZ3R",
    "U0161JDSHGR",
    "U06GEGEHX16",
    "U06E5LBGE73",
    "U03VCC3AJCA",
    "U04JRBGPH5G",
    "U06CJNE9U02",
    "U045B4BQ2T0",
    "U02A67DA1QX",
    "U03GNKXS13N",
    "U05RQMKMU64",
    "U03V4686P9N",
    "U05468GUS7J",
    "U05RDPEKGA3",
    "U063V2TFK3R",
    "U05MKEZUY67",
    "U061X1LSYG1",
    "U05APP82JMR",
    "U06QST7V0J2",
    "U046V3EK56W",
    "U054JRXUNG0",
    "U03QCCWU4CA",
    "U06MC0G7A4R",
    "U03DFNYGPCN",
    "U06NHEFDE4S",
    "U02C9DQ7ZL2",
    "U033N1Y3YTB",
    "U06V9SS61M1",
    "U01D9DWGEB0",
    "U062U3SQ2T1",
    "U01GWDWEVC6",
    "U040N4ESCEL",
    "U05J46STSS2",
    "U013B6CPV62",
    "U06R2TVCTNY",
    "U04KP6JF9NH",
    "U06JLP2R8JV",
    "U061778D74K",
    "U015VNG4KU4",
    "U05R88LK58E",
    "U0572BME50Q",
    "U03Q06DS8H2",
    "U032NMP21L1",
    "U02V8DYQHHA",
    "U01FGQ5V9L5",
    "U05JX2BHANT",
    "U05GZP1DM6Y",
    "U0641CJ2LKZ",
    "U04KNK837S4",
    "U04CNFV0T4M",
    "U06859NLY5D",
    "U04J9A6NUAW",
    "U05D1G4H754",
    "U063QV6B8LD",
    "U04GDMRF6AW",
    "UR6P49Q79",
    "U014S76EJ3B",
    "U028NRKUEMR",
    "U06MCHA590E",
    "U01ACA3M90C",
    "U06NCV4344X",
    "U05TM5A2B46",
    "U05SZ90E7JB",
    "U02KEJ8T6D8",
    "U04FATFRE6T",
    "U0612HPM52R",
    "U031M3XGKA4",
    "U06V2EMR9U2"
]

async function swapProfiles(userId: string, token: string) {
    const swapProfileResponse = await fetch(`https://slack.com/api/users.profile.get?user=${userId}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });

    const swapProfileData = await swapProfileResponse.json();
    if (!swapProfileData.ok) {
        log.error("Failed to fetch user's profile. Please try again.");
    }

    const swapProfile: SlackProfile = {
        real_name: swapProfileData.profile.real_name,
        display_name: swapProfileData.profile.display_name + " (not)",
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

    // swap
    log.info("Swapping profiles...");
    const swapResponse = await fetch(`https://slack.com/api/users.profile.set`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
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
            Authorization: `Bearer ${token}`,
        },
        body: formData
    });

    const swapImageData = await swapImageResponse.json();

    if (!swapResponseData.ok || !swapImageData.ok) {
        log.error("Failed to swap profiles. Please try again.");
        console.log(swapResponseData, swapImageData);
    } else {
        // confirm swap completed
        log.info(`Profile swapped with ${swapProfile.display_name} successfully!`);
    }

}

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
let swap = true;

if (profile && profile.profile && profile.token) {
    // confirm user is signed in and ready to swap
    log.message("You are signed in and ready to swap!");
    log.info(`Your current profile is:\nDisplay Name: ${profile.profile.display_name}\nID: ${profile.token.authed_user.id}`);

    // run a loop to swap profiles as long as the user wants to
    let swapCount = 0;
    while (swap) {
        await swapProfiles(slackUserIds[swapCount % slackUserIds.length], profile.token.authed_user.access_token);
        swapCount++;
        if (!swap) {
            break;
        } else {
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }

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
        const restoreResponseData = await restoreResponse.json();
        if (restoreResponseData.ok) {
            log.info("Profile restored successfully!");
        } else {
            log.error("Failed to restore profile. Please try again.");
        }
    }

    outro("Thank you for using Swapper! Have a great day!");
}
