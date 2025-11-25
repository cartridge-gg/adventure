# Lost Temple Retrospective

This repo was deployed as "The Lost Temple Adventure" at Devconnect ARG to provide a casual, engaging activity for conference participants.
Our goals were to contribute to the conference as a member of the larger Ethereum community, as well as showcase the Cartridge ecosystem to a wider audience.

This retrospective will review the activation and share lessons learned.

## Background and Context

Treasure hunts have been a fixture of crypto and hacker conferences for many years.
Beginning with 2018's _Hunt Zuckerberg_, the team at [Social Dist0rtion Protocol](https://www.dist0rtion.com/) has run regular treasure hunts at computer conferences, with puzzles involving system hacking and cryptographic code-breaking.
In 2019, the team at [Daedalus Industries](https://daedalus.industries/) began producing elaborate escape rooms at web3 conferences, beginning with [_The Spy Who Staked Me_](https://medium.com/ethberlin/crypto-educational-escape-rooms-lessons-from-berlin-85f6765535c3) at EthBerlin Zwei.
Eventually, these teams would join forces to become a leading brand in web3 treasure hunts, creating the [THC framework](https://github.com/social-dist0rtion-protocol/thc) and most recently running _Sybil Resistance_ at Devcon SEA in 2024.

Having contributed to _The Spy Who Staked Me_ and _Sybil Resistance_, I had a good rapport with the SDP and Daedalus teams, and in August of this year, reached out to see if they were planning on having a presence at Devconnect.
They said they were not, and so I proposed to the Cartridge team that we run our own treasure hunt, showcasing Cartridge products and inviting conference participants to interact with our ecosystem of fully onchain games.

## Ideation and Planning

We began by [sharing a proposal](https://forum.devcon.org/t/focg-treasure-hunt/8099) for a "FOCG Treasure Hunt" in the Devconnect discourse on Oct 1, with the following pitch:

```
A multi-stage treasure hunt for DevConnect participants, mixing virtual games with real-world puzzles, culminating in an IRL event for participants who complete the adventure. The goal is to excite and inspire participants with a fun, accessible, and novel experience, as well as increase exposure to onchain games more broadly.
```

After amplifying it through our ecosystem and demonstrating interest and traction, we got the attention of Ligi, one of the EF organizers, who would become our main point of contact.
Ligi asked us to rebrand away from "treasure hunt" to "adventure" on the grounds that the brand was associated with the SDP/Daedalus-style of cryptographic puzzles, and that our more casual and gaming-focused experience might confuse participants expecting more difficult or elaborate challenges.
Ligi also asked us to host the physical puzzles at community hubs instead of asking for private spaces, as conference space was at a premium.

After clarifying these and a few other points, Ligi asked us to submit a formal DIP.
Our proposal, [DIP-69](https://github.com/efdevcon/DIPs/blob/master/DIPs/DIP-69.md), was for an alternating sequence of in-person "puzzles" and onchain "challenges", with puzzles being hosted at community hubs and the challenges being Dojo ecosystem games.
The proposal was officially approved on Oct 28, giving us the green light to begin production.

With only a single developer on the project, and with less than three weeks of lead time before Devconnect (and an ongoing Game Jam), the short production timeline forced us to be judicious with priority and scope.

## Design and Implementation

The core implementation concept was that a user's state would be stored as a bitmap on an ERC-721 "Adventure Map" NFT, consistent with the larger Dojo ecosystem idea of game sessions as tokens.
Wrapping the ERC721 contract was the Lost Temple game itself, a Dojo application which minted map tokens to users and handled game progression and level validation.

Fortunately, the basic technical architecture was identical to the [Ronin's Pact activation](https://github.com/cartridge-gg/ronins-pact) we had run only a few weeks prior, which also used a hybrid ERC-721 / Dojo architecture, a stand-alone client, and fully-onchain art assets.
Being able to reference the Ronin's Pact implementation de-risked the initiative significantly.

### Map NFT

The Ronin's Pact NFT had made use of dynamic onchain art, but without any per-user customization.
Something that we were excited to explore with this project was having the map path be pseudorandomized per-user, making each map NFT unique.
By representing user state in this way, the player "crafts" a personalized collectible over the course of their gameplay, enhancing and anchoring the emotional experience.
This approach was inspired by the "1 of 1 of X" concept popularized by digital artist and Art Blocks founder [Erick "Snowfro" Calderon](https://x.com/ArtOnBlockchain), through which participants acquire a unique element of a thematically-linked series.
For the procedural map generation, we implemented a [simple graphing library](https://github.com/cartridge-gg/focg-adventure/blob/main/contracts/src/token/geo.cairo) with trigonometric functions for placing waypoints and a Fisher-Yates shuffle for randomizing the ordering of the levels.

We also wanted to push the envelope further with regards to art assets.
The Ronin's Pact ERC-721 put a total of [17kb of SVG assets](https://github.com/cartridge-gg/ronins-pact/blob/main/contracts/src/token/svg.cairo) onchain.
For the Adventure Map, we scaled up by 3x, deploying a total of [45kb of SVG assets](https://github.com/cartridge-gg/focg-adventure/blob/main/contracts/src/token/art.cairo).
Initially we had been cautious about putting so many art assets onchain, but this turned out to be easy on Starknet, costing on the order of 10 STRK (~$1.50) for the entire deployment.

The full implementation of the Adventure Map can be found under [`contracts/src/token`](https://github.com/cartridge-gg/focg-adventure/tree/main/contracts/src/token).

<img src="/client/public/map.png" alt="Adventure Map" width="400">

### Dojo Game

The Lost Temple application itself was implemented as a Dojo game, handling the puzzle logic and managing the Adventure Map state.

The entire game involved three models: a singleton configuration model, a per-player token mapping, and a level configuration.
Each level configuration consisted of three values: a level number, a type (`challenge` or `puzzle`), and a solution represented as a `ContractAddress` -- the `Minigame` contract in the case of onchain challenges, and the codeword-derived public key in the case of in-person puzzles.

The application involved only three entrypoints: `mint`, `complete_challenge_level`, and `complete_puzzle_level`, which we discuss below.

#### `mint`

The `mint` function does essentially what it says on the tin: minting a new Adventure Map for the user.
The map token is a standard (and transferrable) ERC-721, but the Dojo application enforces a one-per-user rule.
This decision was partially to prevent participants from griefing the leaderboard by creating multiple maps, as well as to allow the client to render the homepage using only contract calls (`get_player_token_id`, `get_progress`).

Calling `mint` [cost about .2 STRK](https://starkscan.co/tx/0x03417f081902948629bbd119807f20d1b001d44547ddd184dc6ec85041917248), driven by the cost of the Fisher-Yates shuffle.

### `complete_challenge_level`

The `complete_challenge_level` function was used to complete onchain challenges, leveraging the Denshokan token standard.
After completing a game session, the client would query the game's Torii instance, find the token ID of the completed game, and submit a transaction containing that token ID.
The contract would then query the game's `Minigame` contract (a part of the Denshokan standard) with the token ID to confirm the completion of the game session, and then mark the level complete.

Calling `complete_challenge_level` was cheap, [costing about .02 STRK](https://starkscan.co/tx/0x06beb1d4b09ecc0cce1c5586f352b2cc43608e0f18017dcbeb8d14e033dbfe60).

### `complete_puzzle_level`

The `complete_puzzle_level` function was used to complete the in-person challenges.
The implementation lifted directly from SDP's THC framework, [which implemented a scheme for replay protection](https://www.dist0rtion.com/2020/01/30/Planetscape-a-dystopian-escape-game-for-36C3/) using a simple ZK proving scheme, which worked as follows:

1. Every puzzle solution was represented by a plain-text codeword.
2. During game development, the codeword would be hashed and used to generate a public/private keypair.
3. The public key would be stored onchain as the solution to the puzzle.
4. During gameplay, a player would discover the codeword and derive the private key, using it to sign a message consisting of their own address.
5. The game would use `check_ecdsa_signature` to recover the public key from the message, confirming the user had access to the codeword.
6. All of this occurs without ever revealing the codeword onchain.

Calling `complete_puzzle_level` was expensive, [costing about .2 STRK](https://starkscan.co/tx/0x02024a0253851e33bfe925da53ae88825a4bd9bf228b627fa7cbde5579f30bd7), driven by the cost of `check_ecdsa_signature`.

All together, with one mint, two challenges, and three puzzles, an entire run of the game cost less than 1 STRK.

### Client

The frontend client was implemented primarily using Vite and React, with Starknet-React providing chain connectivity.
As with the Ronin's Pact, we chose not to use a Torii indexer, which enabled a fully serverless deployment at the cost of some advanced UI capabilities.

The overall design was based on the Ronin's Pact client, with a progress-tracking NFT being rendered next to a sequence of level components.
Aesthetically, we went with an "80s dark fantasy" style, which Claude implemented to the best of their ability, leveraging dark colors and textures to create a mysterious and retro feel.

The adventure was initially pitched as the "FOCG Adventure" but later renamed to "The Lost Temple" as "FOCG Adventure" did not exactly roll off the tongue.
We intentionally went light on lore, offering a general fantasy ambience ("lost temple", "finding waypoints", "breaking seals") in lieu of a high-effort narrative.

On a call with Alberto from SDP in the week leading up to the event, he suggested we put a prominent support link in the UI, directing people to message me directly on Telegram.
This ended up being quite consequential, which we will discuss later.

At the request of the EF organizers, we added a [leaderboard](https://adventure.cartridge.gg/leaderboard) which rendered all maps sorted by their progress and minting timestamp.
While the implementation of the leaderboard used chain queries and was far from optimal, it ended up being a useful feature for monitoring the overall performance of the adventure.

### Puzzle Design

The in-person puzzles were designed to evoke gaming nostalgia, as well as be feasible to execute within the constraints of the community hubs.
On a scale of difficulty ranging from 1-10, they were supposed to be about a 2 -- which meant that in practice, they were closer to a 6.
This miscalibration would prove consequential, as we'll discuss in the Results section.
We ultimately went with three puzzles:

#### Cracking the Code

This puzzle involved an original Super Nintendo set up with two controllers and a classic Konami game, as well as a few back-issues of Nintendo Power magazine.
The participants were supposed to assess the scene and intuit that the answer was KONAMI, the classic "code" of video game lore.

#### Just my Type

This puzzle involved a stack of original Pokemon cards placed next to a chart of Pokemon type interactions.
The participants were supposed to use the type chart to order the cards from weakest to strongest, with the solution, FIGHTING, being the type of the strongest card (specifically, of Mankey).

#### Tower of Battle

This puzzle involved a Jenga set.
Participants were supposed to challenge somebody nearby to a game, and ask the hub organizer for the code, COLLAPSE, upon victory.
The idea here was that the "final level" of the adventure would be PvP, adding a competitive element to an otherwise solo-able adventure.

All of the puzzle props were acquired in the days leading up to Devconnect, mostly off of eBay.

## Deployment and Operations

### Setup

The technical implementation and puzzle planning took up the majority of the time in the weeks leading up to Devconnect, meaning that coordination with the community hubs did not begin until the final days leading up to the event.
Arriving in Buenos Aires on Monday morning, we had two locations confirmed, with the Governance Geeks hub hosting one puzzle and the final battle taking place in the Gaming District.
A good chunk of Monday afternoon was spent scouting the venue for hubs and trying to find organizers willing to host a puzzle.
After a few hours of searching, we confirmed the Node Operators hub for our final puzzle.
During this time, we threw together a simple flyer for the event, and the EF organizers graciously printed out a few dozen copies.

The contracts were deployed to Mainnet only on Monday night.
We had initially planned on a six-stage adventure, with three onchain challenges and three in-person puzzles.
We were waiting to learn if a third game could be included, but external implementation challenges ultimately led to that level being dropped.
The deployment to Mainnet went smoothly and without incident.
The Cartridge team was very responsive and immediately set up a Paymaster to cover user transactions, enabling seamless user onboarding.

On Tuesday morning, we visited the community hubs and set up the puzzles.
The Pokemon puzzle was set up in a corner inside of the Governance Geeks hub, the SNES puzzle was set up in a lounging area at the periphery of the Node Operators hub, and the Jenga puzzle was set up in the corner of the discussion lounge in the Gaming District.

With the code deployed and the puzzles in place, we could finally begin amplifying the adventure, posting flyers in conspicuous locations.
The lo-fi, emoji-heavy aesthetic of the flyers seemed to catch people's attention, and most people we spoke to were willing to at least scan the QR code.

### Production

Once the puzzles were deployed, relatively little effort was needed to maintain them.
Once or twice a day, we would make a round of the venue and make sure that the puzzles were intact and the flyers were still up.
Players would discover the game through the QR codes posted around the event, onboard themselves with the Cartridge Controller, and immediately begin making Paymastered transactions.
The onboarding process was very smooth and we had no issues getting people onboarded to the experience.
Overall, the technical implementation was robust, with no bugs being found during the entire week of the event.

We received occasional support queries via Telegram, which turned out to be invaluable in helping to balance the puzzles on-the-fly.
Through this feedback, we were able to get a much better sense of where people struggled and make adjustments accordingly.
While the contracts themselves were never updated, we pushed frequent client updates, tweaking instructions and adding clarifying tips and hints.

Regarding the puzzles, they mostly held up, but loss or theft of the puzzle pieces was an ongoing issue.
At one point the Pokemon cards vanished, which we replaced the next day out of a reserve.
The Jenga set disappeared when the organizers reorganized the interior spaces in advance of Thursday's rains, which we also replaced out of a reserve.
The SNES, sadly, disappeared twice: once on Thursday morning -- turning up later that day at lost and found -- and again on Friday, never to be seen again.

Fortunately, inventory loss didn't critically degrade the game -- we could place cards containing the codeword in place of the missing pieces, allowing participants to continue playing, slightly disappointed, after finding the puzzle location.

People overall seemed to really enjoy the adventure.
When we spoke to players, they were excited and having fun.

<img src="/assets/snes-puzzle.jpeg" alt="SNES Puzzle" width="500">

<img src="/assets/type-puzzle.jpeg" alt="Type Puzzle" width="500">

<img src="/assets/jenga-puzzle.jpeg" alt="Jenga Puzzle" width="500">

## Results

SDP's first activation had 10 participants and 3 finishers, while their third activation had 254 participants and 12 completions, a completion rate of ~5% ([source](https://www.dist0rtion.com/2020/01/30/Planetscape-a-dystopian-escape-game-for-36C3/)).
In the days leading up to the activation, our hope was that we would have 100 people mint maps and 10 people complete the adventure.

Over the course of Devconnect, we had 118 adventure maps minted.
Of those 118, 12 were minted either as tests by Cartridge teammates, or outside of the game window, leaving 106 valid maps:

<img src="/assets/cumulative-mints.png" alt="Cumulative Mints" width="600">

### Minting Behaviors

Most mints occur in the latter part of the day, possibly due to participants being more available for exploration after their morning meetings, or else that most participants typically did not arrive to the venue until the afternoon.
The greatest spike in mints occurred on Wednesday, as this was the day we most actively promoted the event on X -- although some proportion of those mints were by people not physically in Buenos Aires, and thus not able to complete the adventure.
Interestingly, the day-over-day decrease in mints was fairly stable, with each day seeing an average of ~62% of the mints of the day before.

### Completion Behaviors

If we assume that approximately 10 maps were minted by remote participants, this leaves 96 maps minted by in-person conference-goers.
Of those, 26 people completed at least one level, and 4 people completed the entire adventure, yielding a completion rate of ~4%:

| Level | Participants | Ratio |
|-------|--------------|-------|
| 0     | 96           | 1.000 |
| 1     | 26           | 0.271 |
| 2     | 20           | 0.208 |
| 3     | 12           | 0.125 |
| 4     | 5            | 0.052 |
| 5     | 4            | 0.042 |

Looking at this progression, we see a high initial drop-off, as ~73% of map minters did not complete a single level.
Among participants who completed the first level, we see consistent churn of ~7 people per level through levels 2-3, but retention improved significantly at level 4, with 80% of participants who reached it going on to complete the adventure, likely due to the high level of investment achieved by that point.

A key open question is why the majority of map-minters churned before completing a single level.
One hypothesis is that participants who minted maps were intrigued by the flyer, but ultimately chose not to participate.
A second and more likely hypothesis is that the first puzzle (the SNES puzzle) was too difficult, leading to high churn among participants not yet invested in the experience.

### Support Behaviors

Over the course of the week, we had 10 players reach out over Telegram for help, including 3 of the 4 people who would complete the adventure.
By fielding user questions, we were able to better understand where people were getting stuck and how to better communicate the goals through the client UI.
Of the inquiries, 4 people asked for help with the SNES puzzle, which suggests that it was indeed a difficult puzzle.
Notably, 75% of all completions made use of this support channel, suggesting that direct support was a critical success factor.

<img src="/assets/tg-help.jpg" alt="Telegram Help" width="500">

Overall, participation fell a bit short of our goals in terms of number of mints and completions, but was largely in line with other first-time treasure hunt activations.
By integrating lessons learned, we should be able to perform much better at future events.

## Reflections and Lessons Learned

### The Good

Overall, the Lost Temple was a success, providing a fun activity for conference-goers and positioning Cartridge as a contributing member of the Ethereum ecosystem.
It proved to be an effective way to onboard new people into the Starknet and Dojo ecosystem, and allowed us to build closer working relationships with EF staff.

Financially, the activation was fairly high-leverage.
The fixed costs included ~$4 in onchain gas fees and about ~$450 in puzzle props, resulting in an average cost of ~$5 per participant.
In addition, the ground operations were fairly straightforward -- the flyers and puzzles required only periodic maintenance once deployed.

The most significant cost was the implementation of the activation itself, which took about two weeks of developer time.
Most of this was spent prototyping and implementing the Adventure Map and client, as well as replay protection and the Denshokan integrations.
Fortunately, much of this work can be reused for future activations.

Assuming future adventures, this fixed cost could be amortized over multiple events, driving marginal costs down to only a few dollars per player.

### The Bad

There were definitely opportunities to improve.

#### Puzzle Operations

In particular, operations around the in-person puzzles left something to be desired.
More advance planning with the hub organizers and more defensive placement of puzzle props would have helped us to more effectively position and secure the game.
In particular, secure overnight storage of props at the community hubs would have made it less likely that the props would have gone missing.
Further, more clearly labeling the props and including contact information would have made it less likely that they would be inadvertently cleaned up by event staff.
On a more logistical note, ensuring that puzzles were clearly visible from about ~30 feet would have made it less likely that a participant would have correctly identified the general location, only to churn after not being able to locate the specific props.

#### Puzzle Design

We could also do a better job of calibrating the difficulty of the puzzles.
As mentioned earlier, the SNES puzzle proved particularly tricky, and as the first level, likely contributed to the high churn rate.
While I personally liked the "vibe-orientation" of the puzzle, it was clearly a poor design, relying too much on ambient cultural knowledge.

#### Session Provision

We could also do a better job of ensuring participants have access to the onchain games.
The adventure did not provide game sessions to players, who had to find other ways of getting access to them.
In the case of Nums, the game itself provided a free session to new players, which made it relatively easy to complete.
In the case of Loot Survivor 2, however, free sessions could only be obtained by finding one of the Booster Packs (a separate Cartridge activation) distributed around the venue, or else buying a session through the game UI.
This proved to be a significant obstacle to adventure completion, and I ended up sending 3 participants game sessions out of my personal supply.
Future iterations should integrate session claiming directly into the adventure client to remove this friction point.

#### Marketing and Comms

We could also do better with marketing the adventure.
The flyers were reasonably effective, but with advance planning the adventure could be featured more prominently in event communications, and highlighted during keynote presentations.

#### Player Incentives

Finally, we could think more about giving participants a reason to play.
The inherent fun of exploring a venue and solving puzzles was attractive, but the story arc felt incomplete, with no culminating reward or prize.
In the initial proposal, we had floated an in-person event exclusive to players who completed the adventure, but ultimately was too ambitious given the other challenges and limited bandwidth available for execution.

## Conclusion

Overall, the Lost Temple Adventure was a success, and will hopefully become the first of many activations.
While there were definitely opportunities to improve, the core hypothesis -- that there was demand for a gaming-focused onchain/offchain adventure game at Ethereum conferences, and that Cartridge has the tools and expertise to execute on such a game -- was unambiguously validated.
By continuing to run adventures for the Ethereum community, we can establish Cartridge as a key part of the ecosystem, pushing the boundaries of interaction, engagement, and experience.
