# swapper

Hi! I assume if you are here you may want to run this thing

Its pretty simple to run: 
1. create a slack app with the `users.profile:read` and `users.profile:write` scopes in the user token field
2. Put the `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` into your env file
3. install dependencies: `bun install`
4. run either the normal mode or the random-switch mode: `bun run index.ts` or `bun run random-switch.ts`

![slack ship ss](/.github/images/slack.png)