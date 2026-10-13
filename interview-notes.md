## Preparing the protected notes-only test owner

I prepared a separate owner for the proposed notebook experiment. I put private access and consent before reservation or provider construction, enforced two begin attempts and a short overall deadline, and retained touch-edit and rendering callbacks. I kept every end path conservative: clear temporary notes, stop media and retain the consumed reservation. The implementation remains dormant and its automated evidence uses synthetic providers; it does not authorize a paid trial or establish customer readiness.

## Verifying the separate database request boundary

I prepared a fixed RPC adapter for the proposed notebook trial and verified it against the isolated database. I bounded response sizes and wait time, rejected incorrect endpoints and malformed records, and kept retries and approval initialization out of this adapter. I confirmed that a lost write response still leaves the start consumed when the owner restarts. The checks use synthetic requests and do not activate the hosted experiment.

## Testing uncertainty through the real local database

I connected the proposed notebook reservation owner to the isolated local database. I simulated a successful write whose acknowledgment was lost and confirmed the owner refused to retry. I also forced two owners to compete from the same snapshot and checked that only one succeeded. Fresh Node processes could not reuse the consumed allowance in any scenario. This strengthens the local persistence evidence while keeping hosted activation and spending separate.

## Verifying reservation locking locally

I prepared separate database storage for the proposed notebook trial and tested it in an isolated PostgreSQL container. I checked that simultaneous starts have only one winner, closed transport cannot refund a start, unauthorized callers cannot read or change the ledger, and rollback cannot erase initialized history. I made invalid transitions explicitly false to avoid ambiguity from SQL null values. I kept the hosted database and actual spending approvals unchanged.

## Separating notebook test reservations

I prepared a separate reservation contract for the proposed notes-only experiment. I made every start consume its allowance permanently, including when local transport closure is observed, because that does not prove remote finalization. I tested concurrency, restart and uncertain write responses using local fixtures. I kept this preparation separate from actual financial approval and from the existing avatar test records.

## Verifying the prepared connection as one flow

I connected the prepared server adapters in synthetic integration tests. I checked that partial speech can reach tentative notebook notes only after token counting, and that exiting cancels pending extraction and clears temporary notes. I also checked that a failed socket termination stays visible instead of being reported as verified cleanup. These tests prepare the real experiment; they do not establish live recognition quality, provider finalization or customer readiness.

## Preparing transcription connection startup

I prepared a single-use server socket opener so I can observe the provider's first packet before handing the connection to the notebook. I kept it disconnected from normal startup and tested it with synthetic sockets. I also made a failed local termination visible to the cleanup owner, which helps preserve a reservation when cleanup is uncertain. I am keeping actual provider compatibility and final usage completion separate from these local checks.

## Preparing server authentication without activating spending

I prepared a separate server HTTP adapter so the notebook can eventually count and extract notes with the same protected provider boundary. I kept it disconnected from normal startup and used synthetic credentials in tests. I made the adapter accept only the two required destinations, remove caller-supplied credentials and stop reuse after shutdown. This gives me testable connection preparation while preserving the approval needed for the real experiment. It does not prove actual provider compatibility or final billing.

# My AI Stylist project story

## Defining the small notebook experiment, 12 October 2026

I prepared a dormant notes-only entry with a separate allowance and a two-turn server limit. Local connection checks complete two counted turns and refuse a third before sending more provider audio. It cannot start from normal application startup or reuse the avatar allowance. All 1,368 prototype checks pass. This is still simulation preparation; a live experiment needs its own reviewed activation and financial approval.

## Checking the complete counted connection, 12 October 2026

I tested counted extraction through the protected startup connection using a real local WebSocket and a simulated browser controller. Notes arrive only after counting; leaving during a count cancels it, and an uncertain cleanup prevents a replacement owner. One assertion needed to wait for browser closure rather than only server closure. All 1,359 prototype tests pass. This is integration evidence with synthetic providers, not a live phone or paid-provider acceptance claim.

## Keeping progressive corrections working, 12 October 2026

I connected counted extraction to the protected notebook session and tested authentication, tentative notes, exit and cleanup uncertainty. Integration review showed that canceling an outdated extraction must not end the whole trial: new words and corrections naturally replace earlier work. I separated operation cancellation from session shutdown while keeping attempted counts and reserved generation tokens consumed. The full 1,356-test suite passes. Actual live provider and phone acceptance remain separate.

## Counting the full extraction input, 12 October 2026

I prepared the official provider token-counting adapter so instructions and the structured-output schema can be included before generation. Simulation checks reject uncertain counts and cancel late response bodies. I also capped counting calls separately after spotting that overlapping unfinished counts could bypass a limit applied only to generation. The full 1,350-test suite passes. Actual model compatibility and counting charges still need a reviewed live check; no extra spending is authorized.

## Connecting accounting to requests, 12 October 2026

I connected the prepared extraction budget to the exact serialized request so counting and sending cannot accidentally use different content. I tested overlapping requests, failed counting, failed delivery and cancellation. Review found a race where an ended owner could return a late result; I added a final cancellation check and regression. The full 1,331-test prototype suite passes. This remains disabled preparation until an authoritative token counter and live activation checks are complete.

## Bounding live-notebook costs, 12 October 2026

I found that limiting request size alone does not bound total extraction spending. I added a disabled aggregate budget that counts attempted requests and reserves input and maximum output tokens, keeping failed attempts counted. Seventeen focused checks pass. The next step is connecting a trusted token counter before dispatch; this preparation alone does not enforce real billing or authorize another paid trial.

## Testing the failure paths, 12 October 2026

After my successful iPhone recovery test, I expanded the simulated browser checks to cover a failed request, blocked playback and invalid avatar audio separately. Each check confirms that the page ends safely without an automatic retry or exposing private error details. This gives me clearer evidence about failure handling without spending more on provider calls. It does not establish why the earlier physical-device follow-up failed.

## My bounded iPhone recovery result, 12 October 2026

I completed the interruption-and-resume test on my iPhone and confirmed all steps worked as expected. The stylist stopped when interrupted, returned in a replacement room, retained the confirmed styling preferences and handled my color correction. Both provider rooms were independently verified ended after the check. I chose replacement rooms because the provider cannot guarantee that already buffered audio is flushed. This validates the bounded experiment, while continuous conversation, timing and the remaining launch checks still need evidence. The earlier failed follow-up's cause remains unknown; a subsequent successful test alone does not prove its root cause was fixed. I kept the approved $41 allocation and did not authorize automatic retries.

## Who I am building for and why

I am building an AI personal stylist for women and men in the United States. I want customers to explain what they need in a natural conversation, use clothing they already own, and refine one look at a time. A visible notebook helps them see and correct what the stylist has understood.

## Key decisions and tradeoffs

I chose real shopping links, with purchases completed on retailer websites. My planned revenue model is affiliate commissions on qualifying purchases. Affiliate program selection and approvals are still dependencies, and customer preferences must govern recommendations.

I require an account before styling, but the stylist collects initial preferences during the first conversation instead of requiring a separate questionnaire. Customers choose what to save to their profile or digital wardrobe. Saving a look does not save its related notebook notes or conversation history.

## Notebook design decision, 9 October 2026

I compared generated concept examples of an open and collapsed notebook and selected the collapsed state when a conversation starts. This gives the notes a compact place in the consultation while keeping the summary, uncertain details, and supplied item thumbnail visible. The tradeoff is that customers expand the notebook to see all fields, the full reference photo, and detailed feedback. They can open it at any time, and the compact summary still updates as the stylist listens.

## Look display decision, 9 October 2026

I chose a coordinated collage as the main look display so customers can see how the selected pieces work together. Individual item details, prices, and retailer shopping links stay below the collage, so customers can inspect and shop each piece. The collage uses the selected item images and preserves garment details.

## Text style decision, 9 October 2026

I compared two typography concepts and chose elegant book-style headings with simple printed text for notes and controls. The headings support the fashion journal style, while the notes, prices, captions, and buttons remain straightforward to read. Detailed rendering and accessibility still need to be checked in a working prototype.

## Navigation decision, 9 October 2026

I chose four main mobile destinations: Stylist, Wardrobe, Saved looks, and Profile. Shopping links sit with the relevant look, and the shopping list is reachable from the app header. This keeps the main menu focused on styling and personal collections while keeping shopping close to the recommended items.

## Delivery decision, 9 October 2026

I chose a website designed for phones for the first version. Customers will access it through their phone browser. App Store and Google Play distribution would need a separate later decision. At that stage, I had confirmed the delivery approach. I later chose Supabase + Render, React + TypeScript and Node.js + TypeScript, as recorded below.

## Account access decision, 9 October 2026

I chose to offer email/password with password recovery alongside Google and Apple sign-in in the first version. Customers can choose their preferred method, and authentication is still required before using the stylist. This adds provider configuration and identity-handling work, which must be planned and checked before launch. None of these sign-in methods has been implemented yet.

## Technical planning and launch scope, 9 October 2026

I asked for a secure architecture that can grow, with technical decisions and system patterns kept in tech-spec.md. I also asked for a phased progress plan with focused automated tests and clear manual verification. I chose one simultaneous consultation for the first launch. That gives the team a concrete initial capacity target while keeping the design extensible. I initially did not know my prototype budget, so I requested a cost estimate before paid work. After reviewing it, I approved a $25 limit for the first private experiment. The voice/avatar connection, live notes, recommendation gate and real product sourcing still need evidence; I have not approved unproven technology choices as settled decisions.

## Supabase responsibility decision, 9 October 2026

I approved Supabase for accounts, saved preferences, wardrobe photos and saved looks. This gives these core responsibilities a shared platform. The separate save choices and privacy boundaries still apply. I later selected Render for the website and conversation service. Optional Supabase uses and operational settings remain under review; the services have not been configured or tested yet.

## Voice provider decision, 9 October 2026

I decided not to use ElevenLabs for this project. OpenAI Realtime and Tavus remain the candidates to test for the voice and realistic avatar experience. The team must verify the actual Tavus voice provider and any fallback against my decision. A failed integration is not a reason to introduce ElevenLabs automatically. The voice/avatar connection and its performance still need a working prototype.

## Discovery planning, 9 October 2026

I asked the team to proceed with Task 1a so I could review a concrete technical and cost proposal before paid setup. I approved a $25 total allowance for the first small experiment, subject to available free avatar minutes and actual account settings. The allowance covers up to $10 OpenAI, $7 hosting and $8 reserve. I subsequently approved the hosting, website/server tools and private-prototype memory tradeoff, as recorded below. A larger trial still needs a separate spending decision.

The planning work highlighted a privacy tradeoff: clearing my app's notebook does not by itself clear an external provider's transcripts or logs. Before I speak into a prototype or use its camera, the team must inspect the actual recording, retention and voice-provider settings and explain the remaining retention. The media connection and notebook timing are still unproven; this planning work is not a completed feature or a resolved bug.

## MVP hosting decision, 9 October 2026

I chose Supabase + Render for the MVP. Supabase will handle accounts, saved preferences, wardrobe photos and saved looks; Render will host the website and conversation service. I already have Supabase Pro. This setup keeps managed account and data tools while reducing the proposed hosting platforms from three to two. An additional Supabase project may still add charges, so the team needs to check available compute credit and show my existing subscription separately from new experiment costs. My $25 initial experiment allowance remains unchanged. I reviewed the website/server tools and private-prototype restart tradeoff separately afterward. The production budget remains undecided. No deployment or account setup has been completed.

## Website tools and prototype memory decision, 9 October 2026

I approved React + TypeScript for the website and Node.js + TypeScript for the conversation service. React fits the interactive notebook and look screens; TypeScript helps catch data-handling mistakes across the website and server. I accepted a simpler temporary-memory approach for the private prototype only. If the server restarts, active notes, feedback and unsaved reference images are lost, while explicitly saved Supabase records remain. The app must explain the interruption and stop old recommendations. This lets us test the difficult voice/avatar path first. I still need to review recovery before customer launch; this choice does not approve permanent conversation storage. These approvals complete Task 1a planning, not a working prototype or a resolved bug.

## How I prioritized technical risk, 9 October 2026

I chose to test the hardest part before building the full app: whether natural voice, a realistic avatar, interruptions and live notebook updates can work together. I separated an approved tool choice from evidence that the integration works. OpenAI Realtime and Tavus remain candidates until the prototype demonstrates the experience I want, and ElevenLabs remains excluded.

I also separated the private experiment from customer launch. Accepting lost unsaved notes after a server restart helps keep the first experiment small, but I still need to review recovery before customers use the MVP. I kept the $25 experiment limit unchanged and required account and privacy checks before real-person media. My existing Supabase Pro plan does not automatically mean an additional project has no cost.

## Major bugs and how I fixed them

I have started an isolated prototype, but I have no confirmed customer-app bugs or fixes to report yet. The voice/avatar connection, notebook timing, preference validation and restart recovery are known risks to investigate. I will record actual bugs, their customer impact, the fix and the verification evidence as development progresses.

## Current stage, 9 October 2026

I completed Task 1a, the planning and decision-review group. My product and design specifications remain approved baselines v1.0. The technical decision document is tech-spec.md v0.10, and the phased progress plan is docs/progress.md v0.7. Remaining technical proposals and launch risks still need review or working evidence.

My approved setup is a website designed for phones, using React + TypeScript, with a Node.js + TypeScript conversation service. Render will host the website and service. Supabase will handle accounts, saved preferences, wardrobe photos and saved looks. Account access includes email/password with recovery, Google and Apple sign-in. The first launch targets one simultaneous consultation.

The planning improvement is a clearer record of what I have approved, what still needs evidence, and what is limited to the private prototype. My temporary-note decision does not approve saving conversations permanently or losing notes during customer use without a separate review.

I approved Task 1b, the small private voice/avatar experiment. A local simulation now tests interruption, cancellation and delayed events without sending my voice or photos to a provider. Its 43 focused automated checks, type check and build pass, and its desktop preview works. The customer app, real voice/avatar integration and phone experience are still unbuilt or unverified. These local files have not been published to GitHub.

## First voice/avatar experiment, 9 October 2026

I kept the first implementation focused on the biggest media risk. The local demo labels its scripted captions and silent test frames as simulated. Its notebook-style panel shows test behavior, while customer preference extraction remains in Task 1c. I can interrupt the simulated response and inject a delayed event to check that canceled work stays canceled.

The important tradeoff is evidence quality: passing local tests helps with state handling, but it does not prove a realistic face, lip sync or natural voice interruption. I kept Task 1b open until account access, provider privacy and voice settings, spending controls and a real phone test are ready. When actual playback position is unknown, the design holds the session rather than guessing how much I heard. No paid provider call or new hosting service was created.

One practical issue was opening the HTML source as a file, which did not run the application. Using the local preview server fixed access. The initial checks also caught a command typing error and a host-header test-client issue; both were corrected and the focused checks passed. These were prototype development findings, not customer-impacting bugs.

## A media sequencing issue I caught early, 9 October 2026

While preparing the real media connection, I checked the local demo against Tavus's current audio streaming contract. The demo sent its end-of-stream marker after waiting for playback to finish. I had that order corrected so the renderer receives completion after generation and queue drain, while playback remains a separate check. Three new regression checks brought the focused suite to 43 passing tests; type checking and the build also passed. This was a prototype sequencing fix, not a customer-reported bug or proof that real lip synchronization works.

I also established private API access for both candidate providers and an $8 monthly OpenAI project limit within my existing experiment allowance. Model listing and privacy-control inspection help prepare the experiment, but I kept actual audio, avatar quality, cancellation and phone checks open until they have working evidence.

## My first audible avatar connection, 9 October 2026

I asked for a repeat of the private scripted test. On the repeat, I heard the generated sentence and saw the stock avatar's mouth move. This gave me evidence that the candidate voice-to-avatar path can work for a buffered desktop clip. It did not prove natural conversation, accurate lip synchronization or the phone experience, so I kept Task 1b open.

I kept my microphone and camera off and used a fixed test sentence. The team added private rooms, recording-off settings, short call limits and a durable usage ledger. Two attempts retained reservations of $4 and ten avatar minutes; these are conservative limits rather than actual bills. Both rooms were verified ended. The focused automated suite now has 68 passing checks, with type checking and build passing.

The first run uncovered a cleanup bug: Tavus returned an empty successful end response, but the prototype tried to parse it as JSON. This made the page report that cleanup needed verification even though the room had ended. I had the team verify the provider status, preserve the usage reservation, fix the parsing assumption and add regression checks. The repeat then closed with provider verification. I still need actual billing reconciliation, provider privacy/consent review before human media, natural interruption and physical-phone checks.

## Checking cost and privacy before real conversations, 9 October 2026

I checked the actual provider dashboards after the scripted tests. Tavus showed 1.9 of 20 free minutes used, and OpenAI showed about two cents for two prototype requests. My eight-dollar OpenAI project limit remained enforced, auto-reload stayed off and optional sharing was disabled. I kept conservative experiment reservations separate from the bill.

The review exposed a remaining privacy dependency: switching recording off does not establish whether Tavus keeps other content or logs, uses content for improvement, or removes backups after deletion. Its detailed Data Management Policy needs access approval, and the public statements did not settle my Free Audio Echo configuration. I kept human microphone and camera use disabled under my existing preflight requirements and had a specific support question prepared. It has not been sent. This is an unresolved finding, not a completed privacy feature or a new architecture decision.

## Checking my devices while provider answers are pending, 9 October 2026

I chose to continue my private experiment while Tavus's privacy answers were pending, then approved a local camera preview and microphone meter. The check keeps my media on my computer and does not record or upload it. It stops when I leave the page, press Stop, or reach two minutes. The team also tested canceled permissions and late device grants so stopping cannot silently reopen my camera.

The focused suite now has 76 passing checks, with type checking and build passing. The browser is waiting for permission; I have not yet confirmed the actual camera image, microphone response or hardware cleanup. This makes progress on device readiness but does not yet let me converse with the stylist or resolve the provider privacy questions.

### My local device check worked

I confirmed that I could see myself and that the microphone meter moved when I spoke. The page also stopped automatically after two minutes, and pressing Stop returned the preview and meter to Off. This verifies the local device check, while real conversation with the stylist and phone testing remain open. My camera and microphone were not sent to a provider during this check.

## What I learned from Tavus support

I brought the provider's reply into the project record. Support said my two scripted tests were not recorded, but recording being off does not mean there are no retained conversation records. It also said self-serve allows anonymized data for training with no opt-out, while no-training commitments, Zero Data Retention and a DPA require Enterprise. There was no fixed backup purge deadline.

This made the tradeoff clearer: I can continue my authorized private prototype, but I have not approved an Enterprise purchase or the customer-launch privacy position. I kept the launch risk open and recorded the difference between ending a call and deleting its data. I did not treat deletion as reversing any model training or promise that clearing my app removes all vendor backups.

## Moving from a fixed sentence to spoken input

I continued the voice experiment with a two-exchange prototype: I can select Talk, speak briefly, and send the message to OpenAI; the generated answer is routed to the Tavus avatar. I chose a buffered test so I can check the complete input-to-avatar path before attempting continuous conversation. This introduces a pause before answers and is not yet the final interaction.

I kept the microphone and reply lengths bounded and reused my existing budget safeguards. The prototype only reuses an assistant reply after I confirm that I heard it completely. If I interrupt, it ends the test and clears the temporary conversation instead of guessing how much I heard. Camera stays off, and the screen explains the provider data flow and Tavus training terms.

The team fixed an asset-loading issue that would have blocked the microphone worklet under the strict browser policy, and made sure replacing playback interrupts the old renderer queue first. The prototype now passes 112 focused synthetic or mocked checks, type checking and build. The page is ready, but I have not yet accepted an actual spoken exchange, confirmed follow-up or live interruption. No new provider call or reservation was used to build it.

## Making the test allowance visible

I selected Play script on the earlier fixed-sentence page while preparing for the spoken test. The review found that all four conservative test reservations had been used, even though Tavus displayed only 2.9 actual minutes. I kept those two numbers separate and did not reset the ledger to get past the limit.

The team added a visible allowance status to both test pages, disabled Start when no attempts remain or cleanup is unresolved, and linked the fixed-sentence page to the spoken test. The 116 focused checks, type check and build pass. The first human spoken exchange still needs verification after the allowance is reviewed.

I approved one additional spoken test capped at two dollars and five minutes from my existing experiment allowance. The change preserves the previous reservations and allows exactly one spoken attempt, while leaving the fixed-sentence test capped. The team verified the guard with 119 passing focused tests, type checking and build; no extra funding or service upgrade was introduced.

## Making the prototype test easier to follow

I found that the avatar could connect while I was still looking for its panel. The fifth attempt ended before I spoke, so I did not count it as a successful conversation. I checked that its room had closed and separated the conservative reservation totals from actual displayed usage: 3.2 free Tavus minutes and $0.03 of OpenAI usage at this check. The precise stop cause was not recorded.

I improved the test page with preparation instructions, the avatar location, a visible countdown and clearer automatic stop messages. I kept the tab-leaving stop and provider time limit. The 120 focused automated checks, type checking and build passed, but I still need a real spoken exchange and phone verification. Another test needs a reviewed allowance amendment.

I approved one further private spoken test by moving $2 from my reserve, keeping my overall $25 prototype budget unchanged. I preserved the five earlier reservation records and restricted the amendment to one spoken attempt. I chose to start it myself when ready on the page, so the short room timer would not run while I searched for the avatar. All 124 focused automated checks passed, along with type checking and build. Real conversation acceptance is still pending.

## First accepted spoken avatar response

I tested the private spoken prototype with a wedding in November, emerald green and a preference for a structured look. The prototype reached two exchanges and generated a reply asking about sleeve length. I confirmed hearing the reply and seeing the avatar mouth move. The room then reached its time limit and its closure was checked. This proved a basic spoken response loop, but I still need to verify interruptions during playback, precise timing and phone behavior. I also learned that the interface must explain when a short test cannot accept another reply.

## Preparing phone testing without resetting limits

I chose my iPhone for the next device test and approved Supabase to preserve the prototype's test-limit records across hosting restarts. I kept this separate from conversation content: the proposed storage holds reservations and cleanup state, not audio or transcripts. I prepared restricted database functions and an adapter that stops when state is missing or uncertain. The 129 focused mocked checks, type checking and build passed. The actual database setup and remote private-access checks are still pending, so I have not claimed a phone deployment.

I created a separate AI Stylist Supabase project after reviewing and approving its additional $10 monthly charge. I disabled automatic table exposure and enabled automatic row security. The prototype test-limit storage was applied, and live checks showed ordinary users could not access it while the server functions had the intended permissions. The existing test history still needs import, and remote phone deployment remains pending.

## Preserving history and protecting the phone preview

I preserved every existing prototype reservation when moving its test-limit records to Supabase. I compared the imported records against the originals, verified that a fresh connection retained the history and confirmed that another unapproved attempt stayed blocked. I disabled the one-time importer after use.

I prepared password protection for the private Render preview and made a server restart stop microphone capture and playback. I kept this separate from the future customer account system. The 135 focused checks, type checking and build passed, but GitHub publication, Render deployment and iPhone acceptance are still pending.

## Preparing a private phone preview

I published the reviewed prototype without credentials or private test records, then deployed it on Render Free. I kept the spending history in Supabase so a server restart would not create a fresh test allowance. I verified that the hosted preview rejects access without its password and that its health check responds. I still need to verify the experience on my physical iPhone; deployment success alone does not prove the conversation works there.

## A phone test exposed a microphone-meter issue

My iPhone showed the camera successfully, but the microphone meter stayed flat in both the app browser and Safari. I treated that as a failed check instead of assuming the microphone worked because permission was granted. I prepared a silent audio-output connection, earlier audio activation and clearer meter diagnostics. The existing 135 automated checks, type checking and build passed. After the compatibility update was deployed, I refreshed Safari on my iPhone and confirmed that the numeric microphone level rises above zero when I speak. That resolved the observed meter symptom; I still need to check device cleanup and the remaining phone conversation behavior.

## Verifying device cleanup on my iPhone

After confirming the microphone meter worked, I checked that pressing Stop removed the camera preview and changed the status to Off. I also let the check run for two minutes and confirmed both devices automatically turned off with the expected message. I kept this local device verification separate from the avatar conversation checks, which still need further testing.

I also confirmed that switching away from the Safari page stops the camera and microphone check. This completed the local device checks; phone avatar playback and interruption still need separate verification.

## Preparing the remaining phone voice test

After completing the local device checks, I approved one additional private phone voice test. I kept earlier test records intact and added a separate allowance amendment instead of resetting the history. Automated checks and a live database check confirm that the next unapproved attempt stays blocked. I will verify avatar playback and the explicit interrupt-and-end control on my iPhone before calling those checks complete.

## Interrupting the avatar on my phone

I tried the private voice test on my iPhone and pressed Interrupt and end during the avatar response. Her sound stopped and the page confirmed the connection closed. The durable record also showed the test was closed. This verified the explicit stop control; it did not establish natural spoken interruptions or resuming a conversation afterward.

I confirmed that I could hear the generated reply and see the avatar mouth move on my iPhone before interrupting it. This gave me evidence that the bounded phone media path works. I kept precise timing, natural interruptions and continuous conversation as open checks instead of treating basic playback as proof of the complete stylist experience.


## Preparing safe recovery after an interruption

I separated stopping speech from safely continuing the conversation. If I interrupt the stylist, the system must not assume I heard the rest of her reply. I added and tested a guarded recovery step for a fresh conversation context, including checks that late or duplicate callbacks cannot restart old speech. This is a component for the next integration step, not a working hands-free conversation. I kept the existing phone preview and the remaining live timing checks clearly separate.


## Preparing continuous microphone input

I added the microphone capture component needed for hands-free conversation. It sends small audio frames instead of waiting for a complete recording, and it stops if the next part of the system cannot accept them. I checked delayed permissions, device loss, page exit, the time limit and cleanup with mocked devices. I kept voice quality and the actual phone conversation as separate checks, since passing automated tests does not prove the full live experience. The component still needs the network and provider connection before it can be used on the conversation page.


## Connecting automatic capture to the avatar probe

I connected the streaming microphone to a separate private check that sends a short spoken request after a pause, without requiring Send. I also connected detected speech during the reply to the safe end control. I kept whole-reply confirmation for a follow-up and stopped the room on interruption, because I cannot yet prove exactly what the customer heard. I documented the risks of background noise, speaker echo and pauses splitting a sentence. Automated checks passed, but this new behavior still needs a real phone check before I can claim it works.


## Keeping the next voice check within its allowance

I approved one more bounded phone check for automatic capture and spoken stopping. I preserved all seven earlier test records, verified the separate amendment and checked that the next unapproved attempt stays blocked. I kept approval, deployment and actual phone acceptance as distinct milestones.


## Checking what the phone test actually proved

The stylist answered my phone request without my pressing Send. By the time I reached the planned interruption step, she had finished speaking. The page later showed a sound-triggered stop, and the test record confirmed the connection was closed. I kept the automatic reply as a confirmed result and left natural interruption unverified. I still need to distinguish a deliberate spoken stop from a possible noise or speaker-echo trigger before deciding what to improve.

## Making the repeat test self-contained

I approved one repeat of the automatic speech check using the last $2 reserve, keeping the initial experiment allocation at $25. I asked for complete instructions before starting so I could interrupt the avatar while she was still speaking without checking the chat. I kept earlier test records and allowed only this single repeat. This preparation does not prove the interruption works; I still need to report what happened on my iPhone.

## Confirming spoken interruption on iPhone

I repeated the automatic speech check with all instructions available before I began. I spoke while the avatar was still replying and confirmed that my words stopped her mid-reply. The app ended the test, and the saved test ledger confirmed the connection closed. This validated spoken interrupt-and-end on my iPhone. It does not yet validate resuming the conversation or precise interruption timing. I kept those limitations separate from the successful result.

## Preparing conversation recovery without guessing what was heard

After confirming spoken interruption on my iPhone, I continued development without spending on another live test. The implementation now has incremental audio generation, a bounded avatar-output queue and recovery checks that reject late responses and unverified connections. I kept “audio sent” separate from “audio heard,” including stopping audio that could still be playing after generation finishes. The 215 automated checks, type checking and build passed with synthetic inputs.

I identified an unresolved vendor contract: the inspected Tavus speaking events do not establish when every old audio chunk is cleared or precisely what reached the listener. I prepared targeted support questions before enabling live recovery. The new components remain separate from the hosted phone flow, and resuming an interrupted conversation is not yet a completed feature.

## Keeping unheard replies out of conversation memory

While waiting for Tavus's technical reply, I continued the work that did not require another paid test. I separated confirmed conversation history from generated replies and connected that memory to the local spoken service. An interrupted reply cannot become confirmed context, and late confirmations cannot restore discarded content. I kept the existing two-exchange prototype limit and cleared volatile content when the session ends.

I also tightened recovery so it waits for acknowledgment that the confirmed context was restored. A stale context revision, failed restoration or timeout keeps recovery held and cleans up the replacement connection. All 231 synthetic automated checks, type checking and build passed. These controls are prepared in code; live recovery and phone acceptance still depend on the vendor contract and later testing.

## Keeping stop controls active after audio is sent

I found and fixed a cleanup gap in the streaming preparation: audio can still be playing after the server has finished sending it. I kept the session's stop connection active through that period and added checks for stopping after delivery and during the final handoff. All 233 automated checks, type checking and the build passed. This is preparation, not a deployed recovery feature. I am still waiting for Tavus to clarify how to verify old audio is cleared before resuming.

## Checking interruption and recovery together

I tested the prepared audio, session and memory components together using simulated provider responses. I checked that interrupted audio could not return, an unheard reply could not become confirmed memory, and a late recovery response could not reopen an ended session. All 236 automated checks passed, along with type checking and the build. I also separated the current prototype status from earlier implementation notes so historical test allowances would not be mistaken for permission to spend again. Actual conversation recovery still needs Tavus clarification and a later approved device test.

## Making the stylist’s understanding visible

While waiting for Tavus to clarify safe conversation recovery, I approved independent work on the styling notebook. I chose to make it reviewable with simulated speech instead of waiting for the voice integration. The notebook shows missing and uncertain details, lets me correct them, and keeps an actual selected item image visible even when collapsed. A newer budget correction cannot be overwritten by an older result.

I also checked that an unvalidated sample stays hidden, that changing a note invalidates its old approval, and that unknown image matches are explained rather than invented. Camera showing remains local and requires a confirmed still before the notebook reference changes. All 265 automated checks, type checking and the build passed. Computer browser checks passed, but I still need to review the notebook and camera behavior myself. Real speech extraction, actual recommendation checks and timing remain future integration work.

## Making test instructions easier to find

When I could not find the full review instructions, I identified that the page only contained a short checklist. I added a clear control at the top and put all 18 steps there, with the same complete guide available below. This lets me read everything before testing. Browser inspection confirmed the guide was complete, and all 265 checks, type checking and the build still passed.

## Completing the notebook prototype review

I finished the complete 18-step notebook review and confirmed that all steps worked. This gave me confidence in the simulated notes, corrections, clothing reference, preference-check controls and session clearing before connecting real speech. I kept that acceptance separate from the remaining integration work: real extraction, recommendation speech gating and timing still need evidence. I did not treat a successful local prototype review as completion of the full app feature.

## Protecting edits during partial speech

I continued preparing the notebook while Tavus's recovery answer was pending. I required partial speech updates to preserve a customer's newer touch edits throughout the same turn, rather than letting a later fragment overwrite them. I also kept extraction results tentative and required evidence from the customer's submitted words. I added timing instrumentation that separates completed, failed and canceled work, so slow results cannot quietly disappear from the measurement. The 282 automated checks, type checking and build pass. This is tested groundwork; real speech integration and live speed acceptance still need evidence.

I then connected the notebook's canned conversation to that coordinator, so the prototype exercises the partial-text processing path rather than writing each field directly. Browser checks confirmed captured notes, uncertainty and protection of the corrected budget. I kept simulated acceptance separate from evidence that a real voice conversation meets our speed target.

## One approval for showing and speaking a look

I required the same current approval to control both a look's display and its spoken description. If a customer changes their budget, preferences or reference item, that approval is revoked immediately. I tested old approvals, changed descriptions and queued simulated speech so an earlier result could not continue recommending a look after a correction. All 303 automated checks, type checking and build passed. The browser also showed the approved sample disappearing after a preference changed. Real avatar playback cancellation and the independent AI validator still need integration evidence.

## Preparing speech input without spending on another trial

I approved preparing live transcription with simulated provider events before activating another paid test. I checked that incremental text reaches the notebook before a turn completes, that a final transcript can correct partial text, and that a late completion from an old turn cannot revive outdated notes. I also required explicit connection readiness, bounded audio and transport queues, and clear cancellation behavior. All 327 automated checks, type checking and build passed. The connection remains disabled, so these results do not claim real recognition quality, measured live speed or verified remote cleanup.

## Owning the full note session lifecycle

I connected the simulated capture source, transcription events and notebook controls under one session owner. Ending or clearing the session now cancels the whole chain, including extraction that is still running. I tested delayed source acquisition and late results so they could not restart capture or refill a cleared notebook. I also required cleanup failures to remain visible rather than claiming the provider connection had been verified closed. All 346 automated checks, type checking and build passed. The work remains a disabled simulation; real audio recognition and physical-device timing still need validation.

## Keeping extracted notes faithful to the customer

I added a strict contract for turning speech fragments into styling notes. The prototype preserves the customer's wording and rejects unsupported changes such as inferring fall from November or treating an unspecified dollar amount as a confirmed USD spending limit. It keeps extracted values tentative and preserves negation. I also added bounded prior context so a phrase split across partial transcripts can still be assigned to the right field, while requiring evidence from the new fragment. All 368 automated checks, type checking and build passed. These checks validate the contract, not an actual model's recognition or interpretation quality.

## Choosing a bounded extraction experiment

I approved a fixed GPT-4.1 mini version to prepare the notebook extraction experiment. I kept that approval separate from paid activation and a production model decision. The adapter requests a strict structure and checks the response again in the application, so a refusal, incomplete reply, old result or unsupported note cannot be treated as a confirmed preference. I required cancellation without retries or silent model changes. All 396 automated checks, type checking and build passed with simulated responses. Actual model interpretation, provider compatibility and live timing still need validation.

## Removing notes when recognition changes its mind

I found an edge case where speech recognition could rewrite an earlier phrase but leave a note based on the old words. I fixed it by tracking the exact notes captured during the current turn and clearing those notes immediately when their transcript is revised. Customer edits and confirmations remain protected, and a look approved using the old notes loses its approval. All 408 automated checks, type checking and build passed. Real speech recognition and device timing still need validation.

## Keeping a notebook tied to its own connection

I prepared a connection ownership guard so a second browser tab cannot take over the active notebook by copying a session ID or customer label. I required exact command shapes and increasing message sequences, then tested old commands, delayed starts and callbacks after the session ends. I also made cleanup failures hold the session slot. All 430 automated checks, type checking and build passed using simulated connections and providers. This is preparation for the authenticated network connection, not proof that customer authentication or real browser isolation is complete.

## Checking the notebook connection over actual local sockets

I prepared the private-preview network control bridge and tested it using real local WebSocket connections with simulated providers. I required the existing preview password, the expected site address and origin before a connection could own a session. I checked a second connection, replayed commands, malformed messages, a delayed start and the time limit. I also verified that disconnecting clears notes from the simulated session. All 453 automated checks, type checking and build passed. The bridge remains unattached to the running app; phone authentication, real provider transport and live timing still need validation.

## Moving notebook updates without moving unrelated data

I prepared the notebook update path across the private connection. I chose to send only the seven structured notes and the revisions needed to reject stale updates, rather than entire session snapshots containing references or other private context. I tested corrections, an old connection's delayed publisher and disconnect cleanup. I also required a render receipt to match the current update before acknowledging it. All 476 automated checks, type checking and build passed with simulated providers and local sockets. The visible notebook is not connected to this path yet, so I have not claimed real speech or display timing acceptance.

## Connecting the visible notebook to validated updates

I connected the visible notebook's simulated conversation to the structured update decoder and revision checks. I required render acknowledgments to match the exact current update after React commits it, and kept their sequence numbers unique across session clears. Browser checks confirmed the sample, the $350 correction, a touch color edit, clearing and a fresh sample. All 487 automated checks, type checking and build passed. The update path runs locally in the page; actual networked speech and physical display timing still need validation.

## Protecting customer edits across the connection

I prepared server checks so an edit or confirmation applies only to the exact note version the customer saw. This prevents a delayed action from silently replacing a newer preference. I also prepared the browser controller without activating microphone or provider access. I tested edits, confirmations, acknowledgment order, disconnect cleanup and deadlines, including real local sockets with simulated providers. All 517 automated checks, type checking and build passed. A stale network command currently ends and clears the private simulation; production recovery still needs a decision. The running notebook remains an in-process simulation, so I have not claimed a live speech integration or another phone test.

## Preparing speech transport without spending another trial

I connected the simulated browser controller to the notebook's owned audio source over real local sockets. I used generated silent audio frames and simulated transcript events, so I could check ordering, turn commits, returned notes and disconnect cleanup without another paid trial. I bounded frame size, sequence and total audio, and required an active owned turn before accepting input. Replayed or skipped frames end the simulation and clear notes. All 540 automated checks, type checking and build passed. The visible notebook still uses its local simulation; real microphone recognition and phone performance remain unproven.

## Handling microphone permission races

I prepared the capture controls so a delayed permission result cannot restart a session after the customer leaves. I kept capture acquisition in the explicit start action, discarded frames locally until the server acknowledged the turn, and stopped capture before commit. I tested permission denial, device loss, cleanup errors and page exit with a simulated device, including the full local socket path. All 554 automated checks, type checking and build passed. The helper covers one turn because a command acknowledgment alone does not prove the provider is ready for the next; multiple-turn readiness and actual Safari behavior still need integration and validation. No paid trial or real microphone was used.

## Preserving preferences between spoken turns

I found that allowing another turn immediately after the server command acknowledgment could cancel the previous turn's final extraction. I required both the transcription commit and final note extraction to finish before recording another turn. I tested two simulated spoken turns over real local sockets, including a green-to-blue correction, delayed extraction, readiness replay and disconnect isolation. All 572 automated checks, type checking and build passed. This removes the preparation helper's one-turn limit; the running notebook still uses simulated speech, and live recognition and avatar recovery remain unproven.

## Protecting an edit while the stylist is taking notes

I found that a customer could open an edit dialog, receive a newer note during speech and accidentally overwrite it with an older draft. I made the visible notebook and prepared server use the same version checks. The notebook now preserves the draft, explains the conflict and offers an explicit way to load the latest value. I reproduced the race in the browser, verified recovery and checked normal save, confirm and cancel. All 584 automated checks, type checking and build passed. Speech is still simulated, and no paid call or deployment was needed for this fix.

## Making connection status understandable

I prepared clear session messages so the notebook can distinguish waiting for a connection, acquiring capture, recording simulated audio and finishing transcript processing. I made cleanup uncertainty explicit and prevented private error text from entering these messages. Six added checks brought the suite to 590 passing tests, with type checking and build also passing. These messages are prepared in the session helper; the visible notebook still needs its connection binding, so I have not claimed a live speech integration.

## Owning the browser connection lifecycle

I prepared one place to bind the notebook connection to page visibility, page exit and connection failures. I made the binding remove listeners and its status timer when it ends, and reject late or malformed messages. I tested asynchronous capture and failures with simulated devices so this work needed no paid provider trial. All 603 automated checks, type checking and build passed. The visible notebook is still a local simulation; actual browser attachment and live provider behavior remain to be validated.

## Verifying the connection as a whole

I tested the prepared notebook connection across a real local socket rather than relying only on separate component checks. Two simulated spoken turns changed a tentative color from green to blue. I verified that losing the connection stopped capture, closing the page cleared both owners, and a late permission result could not restart the session. All 606 automated checks, type checking and build passed. I kept provider responses and devices simulated, so these results do not establish real speech quality or phone acceptance.

## Making the prepared connection visible

I added a separate connection rehearsal to the notebook page so I could review the prepared session controls as a visible flow. I reused the client and owner contracts, generated silent audio and scripted a green-to-blue correction. I kept the rehearsal separate from the main notebook and photos. Browser checks passed both turns, confirmation and ending with cleared notes; all 614 automated checks, type checking and build passed. The rehearsal uses no network or real speech, so live integration and customer testing remain open.

## Reviewing the connection rehearsal

I completed all seven local connection rehearsal steps, including the ready status, green-to-blue correction, confirmation and clearing the notes at the end. This gave me a visible check of the simulated session flow. I kept this acceptance separate from real speech quality, hosted security and phone testing, which still need validation.

## Keeping retailer integration independent

I prioritized the catalog contract because it had no unfinished implementation dependencies. I preserved product and variant identities, prices, evidence dates and permissions, and tested two different synthetic source formats against the same contract. I then added four original illustrations and searchable sample products, with no purchase links or inventory claims. Browser checks passed all-items search, Blue search, loaded artwork and empty results; all 650 tests, type checking and build passed. I also compared public retailer routes and found that one historical ASOS network listing was closed. I recorded missing permissions instead of treating a public feed advertisement as approval.

## Preparing the notebook extraction connection

I separated the model request from the notebook rules so I could test failures before spending more on live trials. I added strict limits on request and response sizes, rejected redirects and malformed responses, and made cancellation discard late responses. During testing, a fixture incorrectly included a confirmation flag that the strict schema forbids. I corrected the fixture while retaining the rule that model-generated notes stay tentative. All 674 checks, type checking and the build passed. This preparation does not prove live speech latency or a completed customer conversation.

I then checked the transcription connection separately from the provider. I used both simulated events and a real socket on my computer connected to a synthetic provider. This let me verify message framing, bounded input, cancellation and cleanup without paying for another trial. The combined preparation produced tentative notebook notes and cleared them on disconnect. I kept live-performance claims separate from these results. The cumulative suite reached 698 passing checks.

I consolidated the prepared connections into one session owner so a failed model request or lost connection would not leave capture or temporary notes active. I tested cancellation while extraction was pending and retained an explicit failure state when cleanup could not be confirmed. The cumulative suite reached 704 passing checks. Live activation and customer launch remained separate gates.

## Connecting the notebook preparation end to end

I connected the prepared transcription and extraction components through the browser bridge and the visible rehearsal. I found that a provider failure needed to notify the browser immediately so capture would stop, and that Ready should wait for the provider configuration acknowledgment. I added those safeguards and kept a session blocked when socket cleanup failed. I verified two turns, confirmation, late-response protection and disconnect cleanup with automated checks, then checked the visible correction and confirmation flow in the browser. All 711 checks, type checking and the build passed. These were synthetic checks and did not use another paid trial.

I also checked all seven preference fields through the combined preparation. I kept ambiguous dates and dollar amounts literal rather than inferring a season, currency or budget scope. A spoken budget reduction invalidated the old sample approval and blocked a look above the newly confirmed maximum. Owned items stayed held because real matching was not built. The suite reached 714 passing checks.

## Handling page exit and late microphone permission

I checked what happens when someone leaves the page, loses a connection or grants microphone permission after the session has already ended. The combined preparation stopped capture, canceled extraction and ignored late responses. I reproduced a cleanup-order bug where the connection owner could hear that a session ended before a device cleanup failure was recorded. I moved that notification until shutdown finished and made the final capture-release attempt independent of the first stop step. All 722 checks, type checking and build passed. I also consolidated the remaining live evidence and business gates so passing simulations would not be mistaken for launch readiness.

I checked that an ended session could not send old model results into a fresh notebook. I also confirmed that a budget correction revoked both the sample look display and the authorization for queued speech frames. Failed cleanup continued to block replacement. The cumulative suite reached 726 passing checks, with type checking and build passing. This remained synthetic preparation, not a real recommendation speech test.

## Protecting the next notebook experiment

I prepared a server owner that checks private access before any allowance or provider work. I tested cancellation while a reservation was pending, concurrent starts, the deadline and failed cleanup. I retained a hold whenever a reservation write or cleanup result was uncertain, rather than retrying and risking duplicate work. I also required an explicit notes-only simulation purpose so the old trial allowance could not accidentally be reused. All 747 checks, type checking and build passed. This was disabled preparation with synthetic services, not another paid experiment or a deployment.

I then checked actual prepared extraction behind the private gate. Partial text produced tentative notes, a touch edit remained intact, and leaving the session canceled a pending model request. Its late result could not restore cleared notes. I exposed a snapshot tied to that session for presentation, while keeping the provider preparation disabled. The cumulative suite reached 749 passing checks.

## Connecting private access to notebook transport

I connected the protected session owner to a simulated browser connection. I waited for the allowance and provider configuration before showing Ready. I tested what happens if the browser leaves during startup, cleanup takes time or closure fails. A late reservation was retired without opening a provider, and uncertain cleanup kept the session blocked without a retry. I also rejected an old session ID on a replacement connection. All 766 checks, type checking and the build passed. I kept this separate from hosted authentication and live provider acceptance.

I then ran the browser lifecycle checks through that protected connection. Leaving or hiding the page, losing the device or connection, and granting microphone permission after the session ended all stopped capture and settled the simulated reservation once. Pending model work was canceled and late results could not restore notes. The suite reached 773 passing checks with type checking and build passing. I kept physical-phone and real-provider evidence separate.


## Keeping expired sessions separate from new work

I tested expiration through the protected notebook connection, including a slow or failed reservation closure. I kept replacement blocked until cleanup succeeded and prevented retries when its outcome was uncertain. I also checked that old model results could not change a fresh notebook. All 777 automated checks, type checking and build passed. I narrowed the remaining API documentation gaps without starting a paid trial or calling simulated results live acceptance.


## Checking the provider contract before activation

I compared the notebook preparation with official API schemas and added eight synthetic compatibility checks. I ensured that billing and language metadata could not become customer preferences, and that incomplete events could not invent note text. I recorded a documentation conflict about delay support and the unresolved transcription startup details instead of guessing. All 785 checks, type checking and build passed. I kept the live provider disabled and preserved the closed experiment history.


## Separating the next experiment allowance

I prepared a separate notebook allowance so a future experiment could not reuse the closed voice-test history. I tested concurrent starts, uncertain writes, failed closure and usage carried between adapter instances sharing a simulated store. The preparation refuses missing or legacy records and cannot initialize or increase an allowance. I kept fixture amounts separate from permission to spend. All 800 checks, type checking and build passed; no remote database, provider test or deployment changed.


## Checking allowance ownership through the browser

I connected the separate simulated allowance to the protected notebook flow. I checked that leaving during a slow reservation did not start a provider later, that cleanup delays blocked replacement, and that two connections sharing one store could not both start. I kept uncertain writes blocked and recorded the database security and verification steps before activation. All 806 checks, type checking and build passed. No actual database or paid trial was changed.


## Verifying the database rules before deployment

I added a shared rule allowing only one reservation append or closure, so approval amounts and earlier history stayed intact. I prepared the separate database migration and tested it in an isolated local PostgreSQL container. The first run caught a syntax error, which I fixed. I also corrected a test that compared JSON formatting instead of its meaning. All 42 local database checks and 823 prototype checks passed, along with type checking and build. I verified access restrictions and competing reservations without changing Supabase or the actual test history.


## Bounding persistence and preserving rollback history

I prepared the notebook database request path with fixed endpoints, size limits and a deadline. I checked that uncertain writes stayed blocked, that a late confirmed reservation was retired after the browser left, and that old voice-test records could not be used as a fallback. I also tested a rollback that refuses to remove initialized history. All 869 prototype checks, 50 isolated database checks, type checking and build passed. The new request path remains simulated, and Supabase has not been changed.


### Checking recovery against a real local database

I wanted to know what would happen if a test reservation was saved but the server never received confirmation. I connected the prepared notebook server components to an isolated local PostgreSQL database and deliberately lost that confirmation. The original owner and a separate fresh Node process both refused another test, preserving the unresolved record. I also checked a lost closure confirmation, a customer leaving during startup and two owners competing for the same reservation. Only one competing owner could start. These checks use synthetic data and providers; they do not prove hosted Supabase authentication or recovery of a real avatar connection. I kept those acceptance requirements open. The existing 869 tests, type checking and build pass, alongside 50 database checks and seven composition scenarios.


### Connecting browser cleanup to the database

I extended the local checks from the notebook server to its browser connection. I verified that leaving the page stops simulated capture and clears notes, while the database reservation closes only after cleanup is verified. A delayed confirmation blocks a replacement connection. Failed closure, a lost acknowledgment and a real eight-second response timeout preserve the unresolved record and block new work. Incorrect access is refused before any database activity. The first run revealed a mistake in my test cleanup: I had expected a deliberately held connection slot to disappear. I corrected the test while preserving that protective behavior. Seven browser/database scenarios now pass alongside the seven owner scenarios, 50 SQL checks and existing 869 tests. These are local synthetic checks, so hosted and real-device acceptance remain open.


### Preserving customer corrections across the connected notebook

I checked the complete local path from synthetic speech events through extraction, browser notes and database reservations. Notes appeared progressively and stayed tentative until confirmed. An older extraction result could not undo a customer's touch correction, including when the final transcript arrived. Leaving the page canceled pending extraction, cleared notes and prevented a late response from bringing them back. These three additional checks bring the local browser/database scenarios to ten. I kept live speech quality, timing and hosted acceptance separate from this synthetic evidence.


### Distinguishing confirmed cleanup from uncertainty

I checked what happens when the transcription provider disconnects, extraction returns invalid data or microphone permission arrives after the customer leaves. The local checks stop capture, clear temporary notes and close the database reservation only after verified cleanup. I also made simulated provider cleanup fail: the reservation stayed open and another test was blocked. I fixed a type annotation in the new test harness, then reran the checks. I revisited the connection documentation and found that an older intent-based example is archived and the token endpoint is deprecated. I kept the selected integration disabled and drafted four precise clarification questions instead of treating those examples as current proof. Fourteen local browser/database scenarios now pass, alongside the seven owner scenarios, 50 SQL checks and existing 869 tests.

## Canceling a look as soon as preferences change

I wanted the stylist to avoid showing or describing a look after the customer changed their requirements. I connected the simulated look approval to the server's own notebook and made starting a new voice turn cancel the old approval before microphone permission resolves. Changes and session closure cancel both the visible look and queued speech. I kept this internal so the browser cannot grant itself permission. My tests also check that a previous session cannot authorize a replacement session's look. This proves the simulated control flow, while real product validation and live speech remain separate work.

## Checking the same look that the customer would hear

I tightened the prototype so a caller cannot simply tell the server that a look passed. The server now copies the candidate, checks its attributes against the confirmed notebook and builds the sample description from those same attributes. My checks cover changes made during validation, prices above the budget, conflicting colors and attempts to inject a separate unchecked description. The tradeoff is deliberate: the fixture checker supports a small synthetic example, so it cannot establish suitability of real products or replace the independent preference agent planned for launch.

## Keeping saved requirements outside the proposed look

I checked the full local flow with two simulated voice turns. The first produced a green preference, which stayed tentative until confirmation. Starting a correction canceled the green look and its queued speech. After confirming blue, the old green candidate was blocked and only a freshly checked blue sample could appear. The database reservation closed once when the session ended.

I then separated saved color exclusions from candidate data. A proposed look cannot choose which exclusions apply to it. The server receives them from a separate simulated profile with a revision, and changing that profile immediately cancels old approvals. Invalid profile data holds new recommendations instead of assuming that no exclusions exist. I tested stale changes and cleanup, fixed a TypeScript declaration and reran all checks. The suite now has 907 passing checks, plus 50 local SQL checks, ten owner scenarios and fourteen browser scenarios. This remains synthetic preparation; real account ownership, saved-profile access and the complete independent preference agent are separate work.


## Keeping private saved preferences out of browser commands

I connected the simulated saved-preference source to the notebook browser flow. When those preferences change, the server cancels old look approvals immediately and sends the browser an updated notebook revision. The saved exclusions themselves stay on the server. I checked that the browser cannot save or replace them by inventing a command.

I also tested malformed profile data while speech extraction or a database reservation was pending. Capture stops, notes clear and late results cannot restore the session. A replacement session receives its own updates, while the ended session stays cleared. I fixed a duplicate variable in the database test script and reran the checks. All 914 prototype tests, 50 local SQL checks, ten owner scenarios and seventeen browser scenarios pass, along with type checking and build. This remains simulated preparation; real account ownership and saved-profile access still need implementation.


## Fixing two bugs found during rapid notebook updates

I checked what happens when saved preferences change several times while a customer edits a note and an older speech result finishes. The customer's confirmed correction remains intact. A later voice turn can still propose a new value, and the browser can acknowledge only its current rendered update.

That review revealed two bugs. Superseded note timing samples could remain marked as waiting to appear, so I made revision changes cancel those samples immediately while keeping successful timing measurements. A new regression also showed that ending a session during its final publication could attempt to close the test reservation twice. I fixed the order of cleanup so every end request shares the same completion operation. Publication errors still stop the session safely.

I reran verification after the initially failing closure test. All 920 prototype tests, 50 local SQL checks, twelve owner scenarios and eighteen browser scenarios pass, together with type checking and build. These checks use simulated media and providers. I kept real customer-profile access, live-service acceptance and financial approvals separate from the findings.


## Separating requirements from preferences

I prepared a versioned saved-preference contract so the stylist can distinguish firm requirements and exclusions from optional preferences. An uncertain requirement stays visible as something to clarify. A conflicting request cannot overwrite a saved rule or create an exception silently. Optional preferences remain separate from the customer's confirmed session requirements.

I made the first reconciliation step deliberately conservative. It compares text, preserves both sources and sends unresolved differences for clarification. It does not claim that a color synonym, budget or subjective style has been validated. I connected the existing simulated color exclusions through the contract before the narrow look checker, while keeping real profile storage and account ownership separate.

All 949 prototype tests, 50 local SQL checks, twelve owner scenarios and eighteen browser scenarios pass, along with type checking and build. I corrected a parameterized-test structure during verification. The contract is preparation for the full validation agent; it does not establish a customer-ready profile or approve a real look.


## Enforcing firm rules without hiding uncertainty

I extended the simulated saved-profile source beyond color exclusions. Firm requirements and exclusions are checked separately from optional preferences. A change cancels old look approvals and queued speech immediately. Invalid profile data stops the session, while a stale update cannot replace newer preferences.

I made unsupported hard rules hold the suggestion, even when the notebook has no conflicting value. The small synthetic checker can compare color, style, occasion and look type directly; it cannot establish saved budget, seasonal or owned-item requirements. Those remain explicit limitations. Held results now explain that clarification or a supported check is needed instead of remaining in a checking state. Private profile rules stay off the browser connection.

All 970 prototype tests, 50 local SQL checks, thirteen owner scenarios and eighteen browser scenarios pass, alongside type checking and build. These are simulated profile and media checks. Real profile ownership, persistent saves, session exceptions and the complete customer validation agent still need implementation.


## Explaining held preference checks safely

I prepared structured clarification records so a held preference check can identify the affected field and reason without revealing private saved values. Each record belongs to one profile revision, notebook revision and held check. Editing notes, changing the profile, starting another check or voice turn, and ending the session clear the old explanation.

I checked that an explanation cannot act as a look approval or change a profile. It also cannot carry into a replacement session. I kept these records on the server for now; showing them in the notebook remains the next integration step.

All 989 prototype tests, 50 local SQL checks, thirteen owner scenarios and eighteen browser scenarios pass, alongside type checking and build. These are simulated records and providers, so customer-facing clarification, real profile storage and live acceptance remain open.


## Making preference explanations visible in the notebook

I added a local review that shows which styling field needs clarification while keeping the suggestion on hold. I kept the wording separate from private saved values and made clear that editing the current note does not save or override a profile.

I prepared the simulated browser connection to clear explanations before a correction or new voice turn. Stale or malformed messages end the connection safely instead of restoring an explanation from an older state. I checked the three-step local flow myself: show the conflict, change the color, and end the review. The actual protected server publication is still the next integration step.

All 1,040 prototype tests, type checking and build pass. These remain simulated services and profiles. Live notebook quality, real profile ownership and customer acceptance are still pending.


## Connecting preference explanations safely

I connected the simulated server's preference explanations to the protected notebook connection. I kept publication on the server and excluded private saved values and profile-changing commands. Corrections, changed preferences and ending a session clear the old explanation. I also handled publication failures so a broken display connection cannot leave the test running.

I expanded the local seven-step review to show a held preference check, correct the color and finish with cleared notes. I completed this review myself. Separately, I checked the server-to-browser flow against the local SQL test ledger, including a fresh session receiving none of the old notes or explanations.

All 1,059 prototype checks, type checking and build pass, plus 50 local SQL checks, thirteen owner scenarios and nineteen browser scenarios. These results use simulated providers and profiles. Customer acceptance, live quality and real saved-profile ownership remain open.


## Handling several preference questions without losing context

I expanded the notebook review to show several unresolved preferences at once. I kept a tentative style note and a missing budget visibly distinct, so asking for clarification does not turn an assumption into a confirmed requirement. Confirming one field removes only that field's question. Rapid preference revisions show only the latest explanation.

I tested the visible flow using Enter and Tab. Focus stayed on the active button while explanations changed, and ending the review cleared the notes. I checked screen-reader announcement markup, but I have not yet tested spoken screen-reader output or this new flow on a phone.

All 1,072 prototype tests, type checking and build pass. The review still uses scripted profiles and simulated services; live customer acceptance remains open.


## Making notebook corrections safe and accessible

I added touch editing to every field in the connected notebook rehearsal so customers can correct what the stylist understood. I made budget meaning explicit: the customer must confirm a USD maximum for item prices, with shipping and tax separate. I kept these edits temporary and required another preference check before a look could be approved.

I bound each draft to the note version the customer opened, preventing an older draft from overwriting a newer correction. During keyboard review, I found that confirming a note removed the focused button. I fixed this by moving focus to Edit before confirmation. Escape and Cancel keep the original note and restore focus.

All 1,089 prototype tests, type checking, build and isolated database checks pass. I verified the visible simulated editor and recorded the remaining phone, screen-reader and live-provider checks separately. These results do not establish customer launch readiness.

I also checked the edit flow over an actual local connection for all seven fields. The tests confirmed that a later budget reduction stays in place and an ended session's draft cannot affect a replacement session, even if their field revisions match. The suite now has 1,098 passing tests; type checking and build pass. The services and allowance remain simulated.


## Protecting an open draft when the conversation changes

I made stale edits and connection loss repeatable in the notebook rehearsal. When a newer Blue note arrived while Red was being edited, the old draft could not overwrite it. The customer could explicitly reload Blue for review or cancel without sending anything. Connection loss removed the draft and temporary notes.

I found another keyboard issue: loading the latest note removed the focused reload button. I moved focus into the updated input, and returned focus to Start when the connection ended. I also clarified the status messages so a canceled draft could not be mistaken for a saved change. All 1,103 tests, type checking and build pass. The browser checks used local scripted events, with real phone and screen-reader acceptance still pending.


## Separating local performance evidence from live readiness

I checked the race between a customer correction, a saved preference change and a delayed extraction response in both event orders. The latest touch correction stayed in place. Earlier visual and speech permissions remained revoked, and a matching sample needed a fresh check before release. Replacement sessions could not reuse the old draft or permission.

I added a local timing panel that shows failed, canceled and pending updates alongside successful ones. I labeled the measurements as simulated so a fast local result could not be mistaken for live acceptance. The panel uses temporary timing metadata only and clears when the rehearsal ends. All 1,109 tests, type checking and build pass; real speech, phone performance and provider startup still need separate evidence.


## Making incomplete timing evidence visible

I made the local timing rehearsal show unfinished and canceled updates, so a fast successful sample could not hide work that never reached acknowledgment. I added a deliberate receipt-hold control with instructions before the test. I verified that a correction canceled the earlier sample and that restarting began with no previous measurements. I kept these results separate from live performance: scripted events cannot prove how quickly the customer’s phone and providers will respond. The latest suite passes 1,115 automated tests; the live integration still needs provider clarification and separate spending authorization.


## Separating a closed connection from completed provider cleanup

I used the AI-assisted support reply to prepare a disabled transcription connection plan, while recording that the proposed address still needed validation. I separated a normal network close from proof of remote processing termination, final usage and deletion. This prevents the prototype from releasing a test allowance just because a socket closed. I added 21 focused checks and requested clarification in the existing support conversation. The full suite now passes 1,136 tests with type checking and build; no new live trial or spending was started.


### Keeping unresolved provider cleanup visible

I made the prototype distinguish local shutdown from verified provider cleanup. A future connection cannot release its test reservation just because its local socket stopped. I added checks for disconnects, timeouts and repeated ending so uncertainty continues to block replacement. I also fixed a race in the isolated database test startup, where a temporary initialization server could appear ready before the final server started. This work prepares the connection boundary without enabling paid services or claiming live acceptance.

I checked the same rule through the protected browser connection: stopping, leaving the page or losing the provider clears local media and notes, while a new allowance reader still refuses an unresolved reservation. The full suite now passes 1,146 checks. These are simulated services, and I have not presented them as live-provider proof.


### Checking uncertainty across application restarts, 11 October 2026

I extended the cleanup checks from an injected store to isolated PostgreSQL. I tested ending, leaving the page and provider failure, then started fresh application readers. The unresolved reservation stayed open and a replacement connection could not create another provider. This mattered because a server restart must not make uncertain cleanup look complete. I also documented the future live connection sequence so the microphone cannot send audio before the provider confirms its configuration. These checks used synthetic providers, and no additional paid trial or deployment was started.


### Separating connection opening from readiness, 11 October 2026

I added a disabled startup controller because an open connection does not mean the stylist is ready to receive speech. It waits for session creation, sends configuration, then requires the matching acknowledgment before exposing the notebook session. I tested cancellation, duplicate events, timeouts and connections returned after the test ended. A type-checking error around cancellation was fixed, and all 1,173 tests, type checking and build now pass. The next step is integrating this controller with the protected test owner; I have not enabled live transcription or started another paid test.


### Connecting readiness to private test ownership, 11 October 2026

I connected the startup controller to the protected owner and browser bridge. The connection now needs private access, a reservation and a valid provider configuration before it reports Ready. Leaving during startup keeps the reservation locked while a delayed socket is still unresolved. I also caught and fixed a case where cancellation inside the Ready callback could return an ended session as active. The full 1,189-test suite, type checking and build pass. The work remains simulated and does not enable another paid test.

I also verified configured startup and cancellation during opening against isolated PostgreSQL. Fresh application processes still saw the unresolved hold. The database checks passed with 17 owner scenarios and 24 browser scenarios, and I kept the real Supabase records unchanged.


### Making project memory usable, 11 October 2026

I turned my product, design, technical and delivery documents into a private website so I could review the project without reading raw Markdown. I kept the full source documents available and added clear summaries, color swatches, design tables and diagrams. I made task updates require evidence and detect conflicting changes, so a checkmark does not silently replace another update. I fixed a cramped phone toolbar and verified the layout at phone and desktop widths. Fifteen automated website checks pass. I then verified signed-in task updates on the published site: the change survived a reload, and I restored the original planning completion with its evidence. The record still matches my Markdown plan. This work does not mean the customer app is finished.


### Keeping corrections authoritative across the full connection, 11 October 2026

I tested two simulated speech turns through the protected startup connection instead of checking the notebook pieces separately. A delayed result could not undo the customer’s newer color correction. Lowering the budget revoked the old look and its permission to speak, and a cheaper look had to pass a fresh check. Leaving during unfinished extraction stopped local capture and discarded its late result. A new connection stayed blocked while provider cleanup remained uncertain. All 1,191 checks, type checking and build pass. This evidence improves the private prototype without claiming live-provider or launch acceptance.


## Making connection startup failures visible, 11 October 2026

I added a simulated connection opener that listens before the connection starts, so an early event cannot disappear. I kept cleanup errors visible even when opening is canceled. That protects the rule that uncertain cleanup must hold the test allowance. Sixteen new checks passed within 1,207 total tests, with type checking and build passing. This is disabled preparation, not a new customer trial or a claim that the provider has finished processing.


## Preserving test limits after interrupted startup, 11 October 2026

I checked the new connection opener through the protected browser and isolated database. Even if opening fails or the customer leaves, a fresh process still sees the unresolved reservation and blocks another provider attempt. The checks passed with 1,211 prototype tests, 50 database checks, 19 server scenarios and 27 browser scenarios. I kept this synthetic evidence separate from live-provider acceptance and did not start another paid trial.


## Keeping affiliate revenue subordinate to product evidence, 11 October 2026

I prepared a disabled affiliate-link validator that uses an exact approved product and variant mapping rather than inventing tracking URLs. It holds stale or unavailable products and keeps the qualifying-purchase disclosure with the link metadata. A click is not earned revenue, and affiliate metadata cannot approve a look or override customer preferences. I also checked startup timeouts and cancellation during connection setup. The full suite passed 1,242 tests, type checking and build. Actual affiliate program approval and live-provider acceptance remain open.


## Revoking shopping actions when requirements change, 11 October 2026

I added a disabled shopping-action boundary so a refreshed product, changed preference or ended session cannot reuse an old affiliate action. I found and fixed a cancellation edge during final authorization. All 1,264 tests, type checking and build passed. I chose to investigate Rakuten first for ASOS and other US fashion programs. The eligibility inquiry is drafted, but it is not sent and no retailer permission is assumed.

I attempted the selected Rakuten eligibility inquiry, but its support form requires an existing publisher ID. I kept the inquiry marked unsent and asked whether I already have an account, rather than inventing an identifier or treating a rejected form as outreach. My reply address stays out of the public repository.

I confirmed that I do not yet have a Rakuten publisher account. I tried the official support widget as well, but it also requires an SID. Both attempts remain accurately marked unsent; registration is a separate decision requiring my credentials and agreement to terms.

## Sequencing affiliate approval

I postponed Rakuten registration until the customer website is live, following its stated live-site requirement. I kept sample-product development moving while preserving retailer independence. My private project documentation and GitHub repository are not presented as the finished customer app. Real shopping links and commission revenue still depend on publisher and retailer approvals.

I fixed a timing edge where a product could change during the final shopping-link authorization check. I now recheck the selected product before releasing an action, including changes where a source forgets to increment its revision. Four new regression cases and all 1,268 prototype tests passed, along with type checking and build. The prototype remains disabled for real shopping.

I fixed a notebook cancellation bug: an error in an earlier screen observer could prevent later handlers from stopping an obsolete look or queued speech. I isolated observer failures and added five regression cases. All 1,273 tests, type checking and build passed. I also prepared a bounded proposal to start the app foundation while the remaining discovery gates stay open, rather than silently changing the agreed phase order.

## Building the app foundation while discovery stays open

I approved building Task 2a in parallel with the remaining discovery checks. I now have a local React/TypeScript shell with four navigation sections, the notebook’s approved visual language and a Node/TypeScript service that refuses production startup. I extracted the seven preference fields into a shared contract so the prototype and new app cannot drift. Seventeen foundation checks and 1,273 prototype regressions pass, with type checking and builds passing. Browser checks cover navigation and a phone-width notebook; my own visual acceptance is still pending. This does not establish working customer accounts or a launch-ready stylist.


## Task 2a visual acceptance, 11 October 2026

I reviewed the local foundation and confirmed all four navigation destinations and the seven-field notebook expand/collapse worked. I completed the foundation milestone while keeping account security and the remaining Phase 1 checks open.


## Preparing private saved images

I approved local data-protection work before the remaining provider checks finished. I started with saved-image records: customers can read their own records, while direct changes are blocked until controlled save interfaces exist. Twelve isolated database checks passed. I kept this evidence separate from hosted Storage and signed-link verification, which still need checking.

Follow-up: 19 local checks now pass, including owner-only Storage policy reads, anonymous/other-owner isolation, blocked upload/update/delete and private bucket limits against a minimal synthetic Storage schema. This does not test real Storage APIs or signed URLs. Next: strict consent/revision-controlled saved-data interfaces and same-owner references.


## Explicit saves and competing edits

I added a controlled wardrobe save so a conversation cannot silently become saved data. A save requires consent and the current revision. Two simultaneous edits cannot overwrite each other: one succeeds and the other must refresh. I also blocked linking another customer's photo. Forty isolated database checks and 33 foundation checks passed; hosted integration remains separate.

I extended those protections to deletion and added an automated database check in GitHub. Deleting a wardrobe entry leaves its image intact until reference-aware cleanup can prove it is unused. This avoids removing an image another saved item still needs. Fifty local database checks now pass.

I also separated explicitly selected profile preferences from the live notebook. The prepared save request rejects transcripts and event details, validates USD amounts in cents and refuses contradictory color choices. The foundation now has 51 passing checks. This contract still needs database integration before it can save a real profile.

I prepared profile saves so the preference update and its revision signal succeed together. A stale or invalid save produces neither change. This creates the foundation for checking another tab’s preference changes before releasing a look; the live invalidation connection is still to be built. The isolated database suite now passes 74 checks.

I added a revision fence so newer saved preferences cancel permits based on an older profile. A permit cannot be reused for another customer. I kept the limitation explicit: the fence still needs an authoritative database check before releasing a real look. The foundation suite now passes 65 tests.

I prepared an owner-scoped revision reader so one customer cannot observe another customer’s profile changes. The consumer rejects stale or inconsistent observations and cancels old permits if the read becomes unavailable. This is locally verified; the real database and recommendation release connection remain separate.

I prepared saved looks made from a customer’s owned items. Saving requires consent, and replacing a look is atomic: invalid components leave the earlier saved look intact. I limited this initial preparation to owned images and labels; retail snapshots and current recommendation checks remain separate. The local database suite passes 108 scenarios.

I added confirmed deletion for saved looks and tested competing edits. Only one edit wins; an older delete request cannot remove a newer version. The request boundary rejects conversation content and unverified retail items. The local checks now cover 122 database scenarios and 90 foundation tests.

I reused the existing catalog rules for saved retail history instead of creating a second validator. A dated saved snapshot cannot act as a fresh recommendation approval. The checks reject stale facts, unapproved imagery and sample products. All 103 foundation tests and 1,273 prototype regression tests passed.

I prepared an image sanitizer that checks actual bytes, removes photo metadata and corrects orientation before producing a bounded WebP image. I tested with generated images rather than customer photos. The foundation suite passes 112 checks. I kept deployment resource limits and actual uploads as unfinished work.

I prepared an image lifecycle that treats a lost response as uncertainty rather than permission to erase data. Uploads are staged first, and deletion cannot finalize until object removal is acknowledged. I verified these paths with simulated adapters and generated images. Actual database locking and hosted storage remain unfinished.

I added database locks to prevent a race between saving an image reference and deleting the image. The concurrent SQL check produces exactly one winner and keeps a consistent result. Pending deletion retains its token and metadata until the server confirms object removal. Hosted object storage remains to be verified.

I prepared recovery for interrupted image saves and deletes. Recovery checks database ownership and verified object evidence; uncertainty keeps the operation pending. A lost response cannot silently authorize data removal. These recovery paths are locally tested, while hosted object storage remains separate.


## Recovering from an uncertain image deletion

I tested image saving and deletion against a real isolated database while simulating object storage failures. I found that a successful deletion could lose its response, leaving the app unable to distinguish completion from an unknown missing record. I added a private, owner-scoped receipt in the same transaction as metadata deletion. It excludes image bytes and checksums. Six recovery scenarios now pass. I kept hosted rollout gated because simulated storage does not establish real provider deletion, and receipt retention still needs a defined policy.


## Checking real image boundaries

I expanded image validation checks to malformed files, oversized decoded images and animated WebP. I caught a misleading test fixture: identical frames had been optimized into a still image. I replaced it with distinct frames and checked the fixture itself before checking rejection. All 140 foundation tests pass; isolated processing resource safeguards are still pending.


## Isolating image decoding

I moved image decoding into a separate process so a malformed image cannot hold the app server in native image work. The parent has a deadline, kills a hung child, and accepts only bounded results. I tested a real crash and hang, then confirmed a later image still works. Native memory needs an OS limit before customer upload is available.


## Keeping older wardrobe images usable

I found that an early image record can use a JPEG filename that does not match its record ID. I updated deletion and recovery so those records remain manageable after the database upgrade. I confined deletion to a safe filename in the verified customer's folder and tested a nested path rejection. The SQL rehearsal proves the compatibility path locally with simulated object storage.


## Saving checked retail facts

I prepared a protected record for the product facts a customer chooses to save. I kept a dated history of the source, price, link and image rights instead of treating saved details as fresh shopping proof. The server checks approved source rules and consent first. The local database rehearsal shows another customer cannot read the record and direct edits are blocked. Retail records still need to be linked to a saved look in one transaction.


## Saving owned and retail pieces together

I designed saved looks to contain my customer's own clothing and real retail products. Retail product facts come from a checked source, then the look and its dated facts save in one database transaction. If a component fails, the whole save rolls back; deleting or replacing a look removes its unused retail history. I kept the customer request to item IDs and labels so a customer cannot invent a price or shopping link. The local rehearsal passed, while real retailer permission and hosted access remain open.


## Guarding saved product history in the database

I added database checks to reject future or fractional source timestamps and invalid prices, even if an application caller bypasses normal catalog validation. The unit checks, type check and build pass. I have not yet rerun PostgreSQL for this final SQL change because the system approval limit blocked Docker; I recorded that as the next verification step.


## Preparing a private database connection

I added a disabled server-side Supabase adapter for saved looks. It only targets the configured Supabase project, keeps the key in server request headers, refuses redirects and bounds request and response time and size. I verified failures with simulated responses; I did not call the live database. The timestamp checks in the newest database migration still need an isolated PostgreSQL run after the system approval limit clears.


## Preparing private wardrobe image storage

I added a disabled Supabase Storage adapter for the private wardrobe-image bucket. It accepts only bounded sanitized image bytes and exact owner-scoped paths, refuses overwrites and redirects, hashes downloaded bytes before reconciliation, and removes one confirmed object key at a time. I tested it with simulated requests, including stalled and oversized streams. The adapter is not connected to a live route, and I did not send a photo or call my Supabase project. The database timestamp checks and actual hosted storage still need verification.


## Connecting image recovery safely

I connected the image lifecycle to separate database and object-storage interfaces while binding every operation to one verified customer. Deletion claims use the customer's authenticated database context; server credentials perform the restricted persistence steps. I found that the earlier transport could restart its timeout after headers or wait indefinitely for cancellation. I replaced that with one deadline and tested stalled cleanup. I also made empty or mismatched deletion acknowledgments keep metadata pending until absence is confirmed. The simulated checks pass; the revised SQL rehearsal and actual hosted storage still need verification.


I found a stale test count in the project-memory website even after the source documents had been updated. I changed the overview to import the plan's current evidence summary during each refresh. A rendering check verifies the displayed text follows that source and stays escaped. This makes the overview easier to trust while keeping hosted acceptance and pending verification explicit.


### Verifying recovery before activation

I kept the new persistence features disabled while I verified their database behavior. When execution became available, the isolated PostgreSQL rehearsal passed the source-date checks and recovery from six lost acknowledgments, including deletion of an older JPEG. I kept simulated Storage and identity evidence separate from hosted acceptance, so passing local checks did not imply that customer uploads were ready.


### Testing the image decoder beyond its JavaScript heap

I treated native image decoding as a resource risk because a JavaScript heap limit does not cap the image library. I verified the actual sanitizer in isolated Linux containers, including an intentional native-memory overload that the kernel contained, CPU throttling and stopping a hung worker. I kept those local results separate from Render acceptance and left customer uploads disabled until the hosted controls can be verified.


### Replacing simulated Storage evidence with a real local API

I tested private image access against a disposable Storage API and database. The real service exposed a missing-object response mismatch that had kept recovery pending; I corrected the transport and reran its checks. I also confirmed that expiring signed links are bearer credentials, so I kept account-bound image delivery as a separate requirement rather than treating expiry as customer isolation.


### Keeping wardrobe URLs tied to an account

I prepared image delivery that checks the customer on each request instead of exposing a reusable Storage link. I tested it with actual local Storage and database records: the owner received the image, while another generated customer using the same app URL did not. I also tested cancellation, sign-out during a download and deletion-state changes. I kept real authentication and hosted acceptance open, since the local identity gate was simulated.


### Preserving existing data during schema changes

I seeded a real local photo and its saved references before applying newer migrations. The upgrade preserved the image and both references. I then confirmed that removing one reference did not delete a photo still used by a saved look. Only after removing both could cleanup delete the object and record its completion. I kept the technical-receipt retention period as an explicit privacy decision.


## Limiting technical deletion records

I chose to keep detailed photo-deletion receipts for seven days so a lost response can be checked without keeping technical details indefinitely. After that, I retain only an image ID linked to the account to prevent accidental reuse, and remove it when the account is deleted. My local database checks cover the time boundary, access restrictions and repeated cleanup. Hosted scheduling still needs verification before launch.


I also checked overlapping cleanup workers. They removed only expired technical receipts, respected each batch limit and left recent records, live photos and retired IDs intact. This helped me separate a verified local database rule from the hosted scheduling and monitoring still needed before launch.


## Protecting the one-customer capacity limit

I prepared a database reservation so two customers cannot claim the stylist at the same time. A reconnect keeps the same reservation, and old requests cannot change a newer one. I also separated reservation expiry from provider cleanup: if a remote call may still exist, the slot stays held until closure is verified. Local race checks pass; real account and provider integration remains open.


I connected the prepared consultation reservation adapter to a disposable real database. I checked reconnects, foreign-account denial and the rule that only one provider start is permitted. A failed acknowledgment stays uncertain, so the app cannot mistake a timeout for permission to start another call. This remains local preparation, with live account and provider acceptance still pending.


I tested what happens when the database succeeds but its reply is lost. The app keeps the uncertain reservation safe, refuses duplicate provider permission and prevents old requests from affecting the next consultation. I also checked overlapping heartbeat and end requests against separate database connections; the ended consultation stayed ended.


## Preparing account access

I prepared the account flow locally so customers can sign in with email/password, Google or Apple without an upfront style questionnaire. I kept registration confirmation separate from signed-in access and made recovery messages generic. I tested cancellation, stale replies and failed sign-out so the interface cannot silently restore an old account. The tests use simulated providers; actual authentication and server access remain to be built.


I separated a valid sign-in token from a currently active session. The prepared server verifier checks actual cryptographic signatures and asks a separate authority whether the session remains active. I also limited stalled checks so repeated timeouts cannot create unlimited background work. These checks use generated keys and simulated session status, so live sign-out and Supabase integration remain open.


I tested the token verifier against a real local database with a synthetic Auth schema. The same signed token stopped working after its session row was removed, even though the token had not expired. I also checked account bans, deletion, anonymous status and cross-account session IDs. This strengthens local evidence while leaving actual Supabase sign-out and configured session policies as separate launch checks.


### Preparing trusted account signing keys

I kept the account prototype local while preparing its trust boundary. I used generated signing keys to test rotation and failure cases without contacting a provider. I limited how often the app can fetch public keys and how much time and data a response can consume. I also tested a stalled connection so repeated requests could not create unlimited background work. These checks strengthen the account foundation, but they do not replace testing real sign-in and recovery later.


### Separating browser requests from trusted identity

I added a local request boundary that accepts one account cookie and verifies its signed identity and current session. I tested foreign sites, conflicting cookies and forged owner headers before connecting customer routes. A generated signed token worked until the simulated session was revoked. I kept actual sign-in and browser cookie acceptance open because these local checks do not prove provider behavior.


I prepared cookie creation only after identity and current-session checks succeed. I used secure browser-only cookie attributes and a matching clear operation. I kept remote sign-out and actual browser acceptance separate from simulated cookie tests so I would not mistake a passing unit test for a finished account system.


### Protecting account callbacks

I prepared short-lived browser-bound sign-in transactions with one-time use and PKCE. I tested replay, the wrong browser, expired links and unsafe return destinations. I kept recovery directed to password reset instead of treating a recovery link as permission to start styling. I recorded the remaining same-browser, restart and provider integration questions so local security checks would not be mistaken for verified customer sign-in.


### Making account flows reviewable before connecting providers

I added clearly labeled simulated account screens so I could review sign-in, registration, recovery and social handoffs without creating accounts or sending email. I kept the stylist disabled even when a sample sign-in succeeded. I checked the flows in the browser and cleared temporary password fields after submission. Real provider and phone acceptance remain separate checks.


### Checking the complete account boundary and keyboard flow

I joined the prepared account security pieces and tested a generated signed token through cookie creation and request authorization. Revoking the simulated session denied both paths. I also checked small-screen wrapping and keyboard focus. I found that canceled requests could accumulate if a provider ignored cancellation, so I capped underlying work and tested recovery after it settled. I kept real provider, phone and screen-reader acceptance open.


I added a generic canceled-account result for provider failures and tested that it consumes the transaction only once. I kept provider error descriptions out of the result and rejected callbacks that mixed success and failure fields. I also wrote a requirement-level account audit so the remaining real-provider, recovery and session lifecycle work stays visible.


### Handling sign-in results that arrive too late

I prepared callback exchange orchestration that verifies the returned identity before preparing an account cookie. I tested sessions arriving after cancellation and made the adapter discard them. When cleanup could not be confirmed, the coordinator held further exchanges instead of assuming the session was gone. I kept recovery outside normal sign-in and documented that real provider cleanup and refresh handling still need acceptance.


## Validating account access before connecting providers

I completed the local account preview and confirmed every step worked and was readable. I kept this separate from real account acceptance because the preview creates no accounts or emails. I added a shared session lifecycle so password and social sign-in cannot bypass one another's pending-work limit or uncertain-cleanup hold. Registration confirmation grants no account access. I tested malformed actions, cancellation and cross-method protection with generated signed tokens and simulated adapters. All 283 local foundation checks pass, along with type checking and build; real recovery, provider configuration and hosted acceptance remain open.


## Distinguishing local sign-out from remote revocation

I prepared sign-out to clear browser access immediately while keeping remote revocation status explicit. A failed or delayed provider response cannot be presented as confirmed sign-out. I bounded pending work so repeated attempts cannot accumulate unlimited stalled requests. I corrected a test that mixed fake-clock deadlines with asynchronous signature checks, then verified all 287 foundation tests, type checking and build. This remains local preparation; real provider revocation and hosted behavior still need acceptance.


## Keeping password recovery separate from account access

I designed recovery to grant temporary password-reset permission only. It never creates normal account access. I made each reset one-use before the provider call starts, so retries after a timeout cannot silently change the password twice. I require confirmation of both the change and cleanup before showing completion. I tested expiry, invalid proof, canceled work, busy admission and late results with simulated capabilities. All 295 foundation checks pass, with type checking and build. Real provider recovery and cross-device usability remain acceptance work.


## Making password recovery understandable

I added a simulated reset step that explains it does not sign the customer in. Matching passwords are required and both fields clear after submission. I made an uncertain result terminal so the interface cannot invite repeated password changes after a timeout. Local browser checks verified mismatch feedback, completion, disabled repeat submission and signed-out messaging. All 300 foundation tests pass, with type checking and build. Real recovery delivery and phone/accessibility acceptance remain open.


## Fixing cancellation during password recovery

I found that discarding reset permission did not abort a password change already in progress. I linked those lifecycles and added tests proving that late success cannot replace an unconfirmed outcome or reuse discarded permission. I kept the limitation explicit: cancellation cannot roll back a password a provider may already have changed. All 302 local foundation checks pass, with type checking and build; actual provider cleanup and reconciliation remain unverified.


## Tying recovery permission to a separate browser cookie

I prepared a separate secure reset cookie so account access cannot accidentally authorize password recovery. I made delivery one-use before the asynchronous password change, tested concurrent replay and limited retained permissions. I kept raw provider errors out of results and made cleanup failure explicit. All 309 foundation tests pass, with type checking and build. This is disconnected local preparation; actual browser delivery, provider proof and restart reconciliation remain acceptance work.


## Verifying the complete local reset path

I connected the prepared recovery owner, browser delivery and account verifier in integration tests. I confirmed the reset cookie cannot access a profile, failed delivery discards permission, cancellation reaches the password-change operation and expiry prevents changes. These tests use simulated provider leases, so I kept real provider acceptance open. All 313 foundation tests pass, with type checking and build.


## Cleaning up recovery when the service closes

I added explicit expiration and shutdown disposal for temporary reset permission. Shutdown stops new work, cancels a reset in progress and cleans each grant once. I bounded cleanup so a stalled provider cannot make shutdown wait indefinitely, while keeping the outcome unconfirmed if cleanup fails. All 317 foundation tests pass, with type checking and build. Real service hooks and recovery after forced termination remain unverified.


## Bounding password-reset requests

I prepared the reset HTTP boundary with same-origin checks, strict bounded JSON parsing, cancellation and a limit on outstanding work. Cookies stay in headers and provider failures never appear in customer responses. I verified oversized and stalled requests without enabling a live endpoint. All 322 foundation tests pass, with type checking and build. Production rate protection and actual provider behavior remain open.


## Testing the full local password-reset response

I verified the HTTP handler with the actual prepared recovery and browser-delivery owners. The response contains only status, clears reset permission in a header and creates no normal account access. A hostile request cannot consume the legitimate reset. All 324 foundation tests pass, with type checking and build. These are local simulated-provider tests; real server/browser and provider acceptance remain open.


## Sharing account request protections

I reused the tested bounded request handler for password sign-in instead of maintaining separate request protections. I verified that signed-in status contains no token or identity details, cookies stay in headers and failed or canceled delivery has an explicit session cleanup path. Registration confirmation cannot sign someone in. All 328 foundation tests pass, with type checking and build. Real provider transport, refresh-state adoption and hosted acceptance remain open.


## Keeping recovery acknowledgments private

I prepared recovery requests to return the same visible acknowledgment for an absent account and a provider failure. I fixed the callback destination internally, rejected extra fields and invalidated the bound callback when canceled. I kept the limitation clear: response-shape tests do not prove constant-time behavior or actual email delivery. All 332 foundation tests pass, with type checking and build. No real email was sent.


## Aligning browser and server account replies

I found that the local controller required a user ID while the prepared HTTP reply intentionally exposed only sign-in status. I aligned the browser presentation contract without inventing an account identity or granting server access. All 333 foundation tests pass, with type checking and build. The private Memory site now includes the preceding account-request checkpoint and remains owner-only.


## Preparing the browser account connection safely

I prepared a disabled browser transport using fixed same-origin paths and cookies, with strict response limits and generic errors. I tested redirected responses, stalled bodies and canceled fetches without connecting a real provider. The preview still uses sample behavior, and browser account state never grants server access. All 341 foundation tests pass, with type checking and build. Real cookie behavior and session adoption remain open.


## Testing sign-in and sign-out across the prepared components

I tested the browser controller and transport with the actual prepared HTTP and session components, using a simulated cookie jar and provider authority. I verified that registration/recovery cannot create account access and that confirmed revocation denies the original token. I also tested failed revocation: local cookies clear, but the outcome stays unconfirmed because the old remote session can remain valid. All 346 foundation checks pass, with type checking and build. Actual browser and provider acceptance remain open.


### Preventing discarded session reuse

I confirmed that all eight sample account review steps worked and were readable. During local engineering review, I strengthened the session owner so an adapter cannot reuse a discarded session object to issue a fresh cookie. I kept cleanup idempotent and added a generated-token regression test. The foundation now passes 347 automated tests, type checking and build. This is local simulated evidence; real provider authentication and hosted acceptance remain open.


I also added a concurrent-session ownership check: two sign-in attempts cannot adopt the same adapter session object. Rejecting the duplicate leaves the first legitimate owner intact. The foundation passes 348 tests, type checking and build. I published the private Memory website through the preceding 347-test checkpoint, keeping it owner-only. Real provider and hosted account acceptance are still separate.


### Preparing session refresh safely

I prepared a local server-only refresh flow so a customer can eventually remain signed in without exposing refresh credentials to browser code. I required verified current access and checked that the refreshed signed identity belongs to the same customer. My tests also cover a late provider result after cancellation. The foundation passes 352 tests, type checking and build. Durable storage, concurrent rotation and real-provider acceptance are still pending, so I kept this disconnected.


I strengthened refresh handling to preserve the exact signed session and reject overlapping rotations for it. I added a local HTTP contract that accepts no refresh credentials from browser JSON and keeps cookies in headers. My tests confirm that failed delivery can discard the newly returned session and that cancellation does not prematurely release a running rotation. All 355 tests, type checking and build pass. These process-local controls still need durable ownership and real-provider acceptance before activation.


I connected the local refresh preparation to the same lifecycle owner as password and social sign-in. A failed cleanup now prevents another account method from bypassing that uncertainty. Refresh stays absent unless a server adapter is explicitly supplied. Three composed tests verify this separation; all 358 foundation tests, type checking and build pass. Real provider and durable-state acceptance remain open.


I added actual local HTTP delivery tests to complement in-memory account tests. They verify that cookie headers remain separate, hostile Host/Origin values cannot reach operation work and a disconnected client cannot keep a late returned session response. All 361 foundation tests, type checking and build pass. The operations are simulated, and browser/TLS, durable adoption and real provider acceptance remain open.


I composed the prepared password verifier and generated signed identity with an actual local HTTP listener. I verified that the token stays out of response JSON and that its secure cookie authorizes only the generated customer/session. I also bounded delivery time and outstanding handlers, including providers that ignore cancellation. All 364 foundation tests, type checking and build pass. The provider remains simulated; actual browser acceptance and durable refresh adoption are separate work.


I added an explicit server-state ownership step before account access can be returned. I tested partial storage failure, a late write after cancellation and a session revoked during the handoff. Cleanup waits for a late write to finish, then removes its simulated state. All 368 foundation tests, type checking and build pass. This prepares the contract; durable refresh storage and real provider acceptance remain open.


I verified the late-adoption cleanup through an actual local HTTP disconnect, alongside the prepared password and signed-identity owners. The late simulated state is removed once after storage settles. All 369 foundation tests, type checking and build pass. I refreshed my private Memory website through the preceding 368-test checkpoint, retaining the explicit live-provider and acceptance limitations.


I prepared encrypted server-held refresh state before adding durable storage. The encryption context ties each record to its customer, session, rotation version and expiry, so moving ciphertext to another scope fails. I tested tampering, expiry and explicit key rotation using generated keys and fixture strings. All 374 foundation tests, type checking and build pass. Production keys, durable fencing and real provider activation remain separate work.


I accepted the completed seven-step reset-screen review and kept that evidence distinct from real recovery. I then rehearsed durable refresh ownership in an isolated PostgreSQL database: competing claims produce one winner, unresolved rotations stay blocked across an actual restart, and stale versions or leases cannot finish another operation. The rehearsal caught a PostgreSQL regex limit, which I fixed. The SQL rehearsal and all 374 foundation tests, type checking and build pass. No live database or real credential was changed.


I connected refresh encryption to a prepared server-only storage adapter. Plaintext is never sent to the storage RPC, and reading a claimed secret is a one-use server capability. I kept refused writes separate from uncertain acknowledgments so a timeout cannot silently authorize a retry. All 380 foundation tests, type checking and build pass. The next check is actual isolated database composition; hosted services remain untouched.


I connected the real encryption and storage adapter to isolated PostgreSQL. I tested lost write acknowledgments without allowing a blind retry, competing claims with one winner, encrypted rotation, a database restart and a wrong key that leaves the record blocked. I also fixed a test-harness startup race by waiting for TCP readiness. The composed rehearsal and all 380 foundation tests, type checking and build pass. Real providers and hosted services remain untouched.


I restricted the prepared refresh storage transport to six explicit operations and added caller cancellation with bounded capacity. If a request ignores cancellation, I keep its slot occupied until it actually settles, preventing hidden work from accumulating. I fixed a test assertion timing issue and confirmed all 383 foundation tests, type checking and build pass. This evidence uses simulated HTTP, so I keep it separate from live provider acceptance.


I prepared staged credential rotation so the existing account lifecycle can adopt a replacement or discard it safely. Cleanup waits for adoption and requires confirmed revocation before removing the matching storage record. Ambiguous provider failures stay blocked. Four simulated scenarios bring the foundation suite to 387 passing tests, with type checking and build passing. Actual database and verified-session composition are the next evidence gates, so I have not enabled live accounts.


I combined encrypted refresh storage, rotation and signed-session verification in an isolated PostgreSQL rehearsal. Successful adoption returns a cookie; a lost write acknowledgment, wrong session or expired access returns no cookie and follows guarded cleanup. The database and token checks are real local components, while provider rotation and revocation remain simulated. The rehearsal and all 387 foundation tests, type checking and build pass, and disposable database resources were removed.


I connected refresh ownership to verified request identity instead of browser-supplied account fields. The local database and HTTP-factory rehearsal confirm valid adoption, identity-input refusal and failed-delivery cleanup. All 392 foundation tests, type checking and build pass. Provider behavior is still simulated, and the customer account routes remain disabled.


I tested the prepared refresh flow over a real local HTTP connection. The cookie arrives only after adoption; disconnecting during adoption triggers one revocation and guarded storage cleanup. All 394 foundation tests, type checking and build pass. I updated the activation checklist to show this local evidence clearly, while keeping real provider, hosted database and HTTPS acceptance separate.


I checked the provider documentation against our account design. I identified default sign-out scope, access-token validity after revocation and ambiguous cleanup as integration risks. I documented the exact evidence needed before activation, rather than treating simulated cleanup as a provider guarantee. This audit changed documentation only; the last verified foundation suite remains 394 passing tests.


I prepared a provider bridge with explicit refresh input and current-session cleanup. It rejects malformed replies, preserves uncertainty and keeps unresolved requests within bounded capacity. All 398 foundation tests, type checking and build pass. Real provider transport remains disconnected, so these simulated checks do not establish remote revocation.


I prepared fixed-project refresh and session-local logout HTTP operations. Simulated responses prove destination restrictions, bounded reading, no automatic retry and conservative cleanup reporting. All 402 foundation tests, type checking and build pass. I kept the exact provider success response and real revocation as activation checks, rather than treating a simulated 204 as live evidence.


I rehearsed the complete prepared refresh pipeline against isolated PostgreSQL with synthetic provider HTTP. It preserved blocked claims after malformed responses and retained ownership after refused logout. This exposed a gap: cleanup uncertainty after adoption was held only in the current process. I recorded durable quarantine as the next required fix before activation. All 402 foundation tests, type checking and build pass; no real provider was contacted.


I fixed the confirmed cleanup-failure path by claiming and holding the adopted credential before remote revocation. The actual local database restart check proves a replacement coordinator cannot refresh that held record. All 402 foundation tests, type checking and build pass. I kept uncertain database-write paths explicitly open instead of extending the restart result beyond what it proves.


I proved lost quarantine acknowledgments remain blocked after actual local database restarts and that cleanup leaves a newer competing generation alone. All 404 foundation tests, type checking and build pass. A separate inspection-failure test exposed that remote revocation is skipped when the database throws. I recorded that concrete outage gap as the next fix, keeping live activation disabled.


I fixed the database-exception path so cleanup still attempts bounded provider revocation when possible. Canceled cleanup never removes ownership based on a late success. All 406 foundation tests, type checking, build and isolated database rehearsals pass. I kept simultaneous database/provider failure as an unresolved reconciliation risk instead of claiming complete outage recovery.


I prepared a separate cleanup reconciliation capability that requires independent proof of exact-session revocation before deleting matching ownership. It refuses stale scope and ambiguous evidence, including local absence without remote confirmation. All 411 foundation tests, type checking and build pass. Actual authority and durable work discovery remain open, so this does not claim complete outage recovery.


I tested reconciliation against actual isolated PostgreSQL, including restart persistence, lost removal acknowledgment and a concurrent newer generation. The scoped checks preserve uncertainty and refuse stale deletion. All 411 foundation tests, type checking and build pass. Proof remains synthetic, and durable discovery of unresolved work is the next implementation requirement.


I added service-only, bounded discovery of retained session metadata without exposing encrypted credentials. Actual local database checks prove access restrictions, restart rediscovery and deletion cascade. All 413 foundation tests, type checking and build pass. I kept candidates separate from cleanup authority because legitimate active sessions must not be removed simply because a scan finds them.


I prepared a bounded reconciliation scan with resumable progress and separate confirmed, stale and unknown counts. Unknown records remain untouched, and cancellation preserves a safe cursor. All 417 foundation tests, type checking and build pass. I documented that reaching the end of a scan is not proof that cleanup finished, and real authority/scheduling remain disconnected.


I verified the bounded scanner against actual local PostgreSQL. It resumed after a database restart, preserved unknown records and removed only records with synthetic exact-session revocation proof. An empty final page did not hide unresolved work. All 417 foundation tests, type checking and build pass. Real authority and scheduled operation remain separate activation requirements.


## Distinguishing a missing session from an outage

I separated session absence from a failed lookup. A database outage must not be presented as a successful sign-out. I kept existing or uncertain sessions unresolved and prepared tests for mismatched owners, cancellation and expired sessions. This remains local preparation, with real account activation still pending.


## Planning encryption-key replacement

I rehearsed key replacement with sample data before provisioning production keys. I confirmed that overlapping keys support a transition and that removing a key early blocks unreadable sessions. I also identified a missing operational requirement: a complete inventory must show which records still depend on each key before retirement.


## Making key usage visible without exposing credentials

I added a private count of records that depend on each encryption key. I included blocked and expired records so a misleading empty inventory cannot justify early key removal. I tested access protection and malformed replies, and kept production retirement dependent on backup and concurrent-writer checks.


## Handling incomplete sign-in responses

I prepared the password-provider connection without enabling real sign-ins. I separated registration confirmation from authenticated sessions and kept cleanup possible when replies arrived late or contained incomplete session data. When saving might have partly succeeded, I kept the result unresolved rather than reporting successful cleanup.


## Saving an initial sign-in safely

I connected initial sign-in preparation to encrypted session ownership. I required verified identity before saving and prevented uncertain save acknowledgments from becoming permission to delete another session record. I tested the local lifecycle and kept real activation separate from these simulated checks.


## Fixing an uncertain initial-save restart bug

I tested a sign-in save whose database acknowledgment was lost while sign-out also failed. The record could remain ready after a restart, so I changed cleanup to quarantine any attempted save before sign-out. I kept uncertain ownership from authorizing deletion and verified the fix against a real isolated database restart.


## Preparing the password service connection

I prepared password and registration HTTP requests with simulated responses, fixed destinations and bounded resource use. I kept registration confirmation separate from authenticated access and tested stalled and oversized responses. Real credentials and sign-ins remain disabled until the hosted acceptance gates are satisfied.


## Testing the complete password preparation path

I connected the password HTTP adapter to the verified session and encrypted database rehearsal. I checked that registration confirmation does not sign someone in, and that an uncertain save followed by failed cleanup remains blocked after restart. I also rejected ambiguous registration responses instead of treating them as confirmation.


## Confirming sign-out independently

I prepared sign-out so clearing a browser cookie or receiving a successful HTTP reply does not automatically mean the remote session ended. I required an independent session-absence check and blocked saved refresh credentials before cleanup where possible. I kept uncertainty visible and tested owner isolation and cleanup ordering locally.


## Checking sign-out against stored sessions

I verified the prepared sign-out flow against an isolated database. A successful provider HTTP reply alone remained unconfirmed. Actual synthetic session deletion cleared encrypted ownership and caused the old signed token to be rejected. I kept cookie clearing separate from proof that the remote session ended.

## Preparing secure social sign-in

I prepared Google and Apple sign-in links so each callback is tied to the browser that started it and cannot be replayed. I kept real provider connections disabled while checking the local behavior with synthetic responses. The remaining work includes the code exchange, real provider configuration and device acceptance.

## Connecting the prepared social sign-in steps

I connected the simulated social sign-in callback to the code exchange and the same session validation used for password sign-in. This reduced duplicate security logic. I checked that malformed responses cannot create access, replayed callbacks fail, and late responses after cancellation retain cleanup ownership. I still need database composition and real provider/device acceptance before calling sign-in complete.

## Checking social sign-in against the database

I tested both prepared social sign-in paths against a disposable database with synthetic provider replies. I verified that a callback could not be reused and that an uncertain session save stayed blocked after a database restart. This gave me stronger evidence than a mocked database alone, while real provider and phone acceptance remain separate.

## Separating password recovery from sign-in

I added a separate check for a recent signed recovery authentication, alongside the existing signature and current-session checks. An ordinary sign-in token cannot pass this recovery check. I tested expiry separately from the normal access-token lifetime, keeping the actual reset adapter and live email acceptance as remaining work.

## Preparing a reset-only recovery session

I connected recovery verification to a one-use reset capability. The adapter rechecks session authority before a password update and requires independent session-removal evidence during cleanup. I also preserved cleanup when identity verification fails, so an error cannot silently abandon a provider session. The provider calls remain simulated and real email/device acceptance is still pending.

## Testing the complete local reset boundary

I tested a signed recovery identity through the callback, reset-only adapter and browser form handler together. The wrong browser and repeated callback were rejected. When the simulated password update succeeded but session cleanup was uncertain, the form reported an unconfirmed result and cleared its reset cookie. Real provider and database composition remain separate checks.

## Preparing recovery service calls

I prepared the recovery request, code exchange and password-update calls with fixed destinations, bounded responses and cancellation handling. Tests use simulated replies and confirm that external callbacks and mismatched account responses fail. Real email delivery, password changes and hosted configuration stay separate from this local preparation.

## Verifying recovery cleanup against primary data

I tested the prepared reset flow against a disposable database. The confirmed synthetic provider removed the actual test session; a logout acknowledgment without deletion stayed unconfirmed. I checked both ordinary-token refusal and reset replay protection. This proves the local composition, while real email delivery and hosted password changes remain untested.

## Completing the social callback delivery step

I found that the prepared social sign-in exchange still needed an HTTP delivery adapter. I added safe local redirects, cookie-only delivery and cleanup for an undelivered successful response. Tests confirm that an external destination or canceled request cannot receive the account cookie. The handler remains disconnected from the real server.

## Delivering a recovery callback safely

I added the recovery callback delivery step so the reset grant becomes a reset-only browser cookie and a fixed local redirect. Canceled or failed delivery cleans up the grant. I also extended the local Node transport with an explicit allowlist for the three supported callbacks and verified separate cookies over loopback HTTP. Real account routes remain disabled.

## Fixing recovery cleanup after a disconnect

I tested signed callbacks over local HTTP, including a delayed reply after the client disconnected. This exposed a case where cancellation stopped identity verification too early for cleanup. I fixed it by verifying identity again using the cleanup operation, without restoring reset permission. The tests now confirm cleanup and no reset access; database verification of the new case is next.

## Confirming the disconnect fix with primary data

I reproduced the delayed recovery result after cancellation against a disposable database. The cleanup verified the signed identity, removed the test session and independently confirmed that removal. No password update or reset permission was granted. This confirms the local fix, while actual hosted provider and device acceptance remain open.

## Preparing social sign-in initiation

I added the same-origin handler that prepares a Google or Apple sign-in handoff. It accepts only the supported providers and local return pages. The browser binding is delivered in a secure cookie while the verifier stays on the server. If the response cannot be delivered, the pending transaction can be removed immediately. Real sign-in is still disabled.

## Account route preparation, 12 October 2026

I added one explicit registry for the prepared account routes so delivery cleanup remains attached to each handler. I kept it disconnected while provider configuration and acceptance checks remain open. All 487 focused tests, type checking and build pass. Sharing the account lifecycle owners and testing shutdown are the next steps.

## Shared account lifecycle, 12 October 2026

I connected the prepared account handlers through one explicit factory. Password sign-in, social sign-in and refresh share session ownership and capacity limits. Shutdown cancels pending requests and closes reset grants, while cleanup uncertainty remains visible. All 489 focused tests, type checking and build pass. This remains local preparation with synthetic providers, not customer account activation.

## Recovery shutdown verification, 12 October 2026

I verified that closing the prepared account service disables a delivered reset permission. A cleanup failure stays visible rather than being reported as success. I also checked that refresh cannot bypass the shared sign-in capacity limit. All 491 tests pass, with type checking and build, using synthetic providers. Real account acceptance remains open.

## Account factory database verification, 12 October 2026

I tested the actual account factory against a disposable database using generated signed identities. Recovery permissions stayed separate from normal account access, could be used only once, and required confirmed cleanup. I kept provider replies synthetic and removed the test database afterward. All 491 foundation tests, type checking and build pass; hosted acceptance is still pending.

## Sign-in factory database checks, 12 October 2026

I extended the disposable database rehearsal to password and Google/Apple sign-in through the actual account factory. I checked that account confirmation does not grant access, callback replay is refused, and undelivered sign-in responses release stored ownership. Provider replies remained synthetic. The full database rehearsal and all 491 foundation tests pass, with type checking and build.

## Refresh and sign-out factory verification, 12 October 2026

I completed the factory-level database checks for refresh and sign-out. Refresh cannot accept a browser-supplied identity, and logout is not reported as confirmed until the primary session is absent. The full disposable database rehearsal and all 491 foundation tests pass, with type checking and build. Hosted acceptance and customer recovery decisions remain open.

## Expired recovery permission maintenance, 12 October 2026

I exposed expiry cleanup through the prepared account factory so a future host can clean expired reset permissions without waiting for another customer request. A focused test confirms cleanup happens once. All 492 tests, type checking and build pass. Scheduling and hosted lifecycle acceptance remain pending.

## Local account request limits, 12 October 2026

I prepared a bounded aggregate request guard so account methods cannot independently bypass a shared local allowance. Excess requests stop before provider work and receive a retry delay. I avoided storing customer identifiers. All 494 tests, type checking and build pass. Durable hosted abuse controls and production settings remain separate acceptance work.

## Guarded account delivery, 12 October 2026

I checked the request guard around the actual account factory, then verified password delivery over a real local HTTP connection with a generated signed identity. Excess requests made no provider calls, and a refused social callback remained usable later. Tokens stayed out of JSON. All 496 tests, type checking and build pass; providers remain synthetic and hosted acceptance is open.

## Browser disconnect and server shutdown, 12 October 2026

I verified that the account factory cleans a late session save when the browser disconnects or the service closes. Shutdown returns an unconfirmed result without an account cookie, and cleanup occurs once after the simulated save settles. All 497 tests, type checking and build pass. Real provider and hosted acceptance remain open.

## Complete callback lifecycle verification, 12 October 2026

I moved social and recovery callback HTTP checks through the actual account factory. Late results after browser disconnect or server shutdown are cleaned without granting access. Recovery still cannot issue a normal account cookie. All 499 tests, type checking and build pass using generated signed identities and simulated providers. Hosted acceptance remains open.

## Undelivered recovery request fix, 12 October 2026

I found that an undelivered recovery-request response could leave its browser transaction pending until expiry. I added idempotent transport cleanup that removes the transaction immediately. It does not claim to recall an email. All 500 tests, type checking and build pass with simulated providers.

## Recovery disconnect verification, 12 October 2026

I verified recovery-request cancellation over a real local HTTP disconnect. The pending browser transaction is removed and its callback is refused. I made the test observe cleanup before checking the callback, so it cannot accidentally consume the transaction and create a false pass. All 501 tests, type checking and build pass with simulated providers.

## Browser social sign-in preparation, 12 October 2026

I found that the browser transport still refused social sign-in even though the server paths were prepared. I added an explicit handoff adapter that validates the destination and callback before navigation, and refuses late canceled responses. The preview remains simulated. All 504 tests, type checking and build pass; real Google/Apple setup is still pending.

## Browser account transport completion, 12 October 2026

I verified the social handoff against the server initiation response and added the missing reset HTTP adapter. Reset uses the server's cookie authority, sends once, and does not sign the customer in. The preview still uses simulated behavior. All 507 tests, type checking and build pass; real provider acceptance remains open.

## Browser reset ownership verification, 12 October 2026

I connected the reset browser adapter to the prepared server grant owner in a simulated integration check. Cleanup failure remains unconfirmed, reset permission is one-use, and no account access is created. All 509 tests, type checking and build pass. Real password changes and hosted acceptance remain pending.

## Account return-page boundaries, 12 October 2026

I reviewed the account return pages and prepared routing that treats URLs only as presentation information. A reset page still requires server-verified permission, and a query string cannot claim the customer is signed in. All 511 tests, type checking and build pass. The preview remains simulated and live page mounting is pending.

## Reset panel configuration, 12 October 2026

I separated the reset panel's simulated preview from explicitly configured reset behavior. The panel starts no request on render and still relies on server permission. All 512 tests, type checking and build pass, including the existing preview checks. Live configuration and browser acceptance remain pending.

## Reset-page readiness, 12 October 2026

I prepared a server-side readiness check that verifies the opaque reset cookie and returns only expiry metadata. It cannot reset a password or sign the customer in, and expired grants are cleaned. All 514 tests, type checking and build pass. HTTP/page integration and hosted acceptance remain pending.

## Preparing secure reset-screen readiness, 12 October 2026

I separated permission to display the password reset screen from permission to change a password. The prepared browser receives only a status and expiry; the server checks its private reset cookie again on submission. This avoids treating a visible screen as proof of account authority. The local suite passes 516 tests, type checking and build. Real recovery and hosted account activation remain pending.

## Preparing the recovery return screen

I made the reset screen wait for server-checked permission before showing password fields. Changing pages cancels the check and prevents late results from restoring an old form. The normal local preview remains simulated. All 519 local tests, type checking and build pass; real recovery acceptance remains open.

## Fixing reset-screen cancellation

I used a local WebKit browser to check the prepared reset flow with simulated data. I found that Return needed to cancel immediately instead of relying on the parent to remove the screen. I fixed it and confirmed late results cannot reopen the form. Password clearing and replay prevention also passed. Real customer recovery remains unverified.

## Making account presentation accurate

I separated sample wording from explicitly configured connected account wording. The connected screen requires an injected provider, uses appropriate password-manager hints and does not offer a simulated recovery shortcut. The ordinary preview remains simulated. All 520 local tests, type checking and build pass; live account acceptance remains pending.

## Checking account wording in a browser

I verified the explicitly connected account presentation in local WebKit using simulated responses. Confirmation and recovery messages were accurate, fields cleared as expected, and canceled Google/Apple handoffs could not update the page later. This gives local interaction evidence while keeping real email, credentials and hosted account activation separate.

## Preventing stale account presentation

I fixed account presentation so a changed provider or mode starts with fresh state and cancels the previous flow. A local WebKit check confirmed that old sign-in messages and fields clear and a late provider response cannot restore the previous handoff. The change preserves server authority and does not enable real accounts.

## Approving the next account stage

I chose password recovery that works when a customer opens the email on another device. I also approved hosted database and account setup before the remaining voice feasibility checks finish. This lets independent account work move forward while preserving the voice-test spending limits. The older same-browser recovery preparation does not yet satisfy my selected experience.

## Reusing recovery safeguards across devices

I kept the same verified, reset-only permission and cleanup rules when adding email-token recovery on another device. An ordinary sign-in token cannot become password-reset authority. The local checks pass, while receiving-browser confirmation and real email acceptance remain unfinished.

## Password recovery across devices, 12 October 2026

I chose to let customers open a password-reset email on a different device. I reused the same bounded, one-use reset permission for both recovery paths so the new path does not gain normal account access. Synthetic tests now cover cancellation and cleanup even when verification finishes late. The receiving-browser confirmation and real email/device checks are still pending.

I separated opening a reset email from confirming the reset. Opening the link creates only a browser-bound confirmation, so an email scanner cannot trigger verification merely by visiting it. The confirmation can be used once, expires after five minutes and is canceled during shutdown. These are synthetic server checks; the real email and device journey is still pending.

I connected the cross-device reset confirmation to the prepared account server. A synthetic journey now opens the email link on a receiving browser, confirms it and changes the password once without signing the customer in. Failed cookie delivery cleans up reset permission. I still need real email, hosted configuration and physical-device acceptance before calling account recovery complete.

I checked the actual reset confirmation page in desktop WebKit over a temporary local HTTPS server. The browser honored the secure cookies and content policy, redirected after confirmation and rejected a repeated confirmation. This uses a synthetic provider and a placeholder reset destination, so it does not replace the real emailed-link and phone acceptance checks.

## First hosted customer-data protections, 12 October 2026

I began the approved hosted database setup with photo records and a private wardrobe bucket. I checked all nine live protection indicators, including row security, blocked direct writes and owner-only read policies. The existing prototype budget table remains present. This is the first two migrations only; the remaining customer schema and real account acceptance are still pending.

I extended the hosted foundation to wardrobe items and saved preferences. I kept direct writes blocked and required explicit consent plus revision checks through controlled functions. Sixteen live installation and access checks passed. No customer save or delete was performed, and real account-bound behavior is still pending.

I added hosted saved-look records and photo lifecycle controls. The database now prevents saved items from pointing at an upload that is incomplete or being deleted. Twenty-three live installation and access checks passed. Actual customer save/upload/deletion acceptance remains pending.

I added private technical receipts for completed photo deletion and owner-readable historical shopping-item records. Fifteen live access checks passed. I kept historical product data distinct from current shopping availability. The seven-day receipt compaction and real customer acceptance are still pending before activation.

## Moving from preparation to hosted database controls

I approved hosted database and account setup while keeping the unfinished voice experiments separate. I installed the reviewed database changes in small transactions and checked access restrictions after each group. Mixed saved looks preserve ownership, detailed photo-deletion receipts expire after seven days, and a single consultation slot matches my initial launch capacity. The latest group passed 21 live metadata checks. I kept account activation and customer acceptance open because installation alone does not prove the full customer journey.

I completed installation of the twenty reviewed customer database migrations and checked the final refresh-session permissions with seventeen live checks. I confirmed the credential table remained empty and ordinary clients could not read or write it directly. I treated this as database setup evidence and kept sign-in, recovery, email delivery and device acceptance open.

## Testing the whole password recovery journey

I connected the email confirmation screen to the actual password form in a local HTTPS browser test. This found a WebKit issue that separate component tests had missed: the browser sent a null origin header, so the server refused the request. I fixed the browser request to send only the fixed site root as its referrer while preserving strict server origin checks. The complete synthetic journey now confirms the link, updates once, clears sensitive fields and reset permission, and remains signed out. The 538-test suite still passes. Real email and physical-device testing are still required.

## Preserving request limits across restarts

I added a shared account request counter in the database so restarting a server cannot reset the allowance. It retains only aggregate technical metadata, not customer identifiers. I checked concurrent requests and a database restart in an isolated rehearsal, then installed the control and verified ten live access checks. I kept sign-out available for cleanup and left the host disabled until its remaining wiring and acceptance checks are complete. The full foundation suite now passes 544 tests.

## Preparing the account host lifecycle

I connected the prepared account handlers to a host wrapper with shared database request limits and explicit startup checks. A failed cleanup check keeps account work unavailable while sign-out remains possible. I tested startup, shutdown, late replies and recurring maintenance over local HTTP, and made unresolved shutdown work visible instead of claiming cleanup had finished. All 550 foundation tests pass. Actual customer hosting and real provider acceptance remain separate.

## Checking that logout really finished

I strengthened account cleanup so a successful provider response is followed by an independent check that the exact session is absent. If the evidence is missing or the check times out, the app keeps cleanup unconfirmed. I kept customer sign-in disabled while testing this composition with simulated providers. Five new focused checks passed, bringing the foundation suite to 555 passing tests. Real hosted account acceptance is still pending.

## Connecting account building blocks

I connected Supabase account adapters, signed identity checks, encrypted session ownership and cleanup controls into one explicit host factory. Creating it starts no customer access. Startup protection, recovery requests and registration confirmation passed local HTTP checks with simulated services. All 559 foundation tests passed. Real hosted sign-in, email and device acceptance remain pending.

## Proving session adoption before delivery

I tested the assembled account host with a generated signed identity. The app checked the current session and stored the refresh secret in an encrypted envelope before sending the browser cookie. I verified that browser JSON and database requests did not expose the refresh secret. The full suite reached 560 passing tests. This remains simulated-service evidence; hosted customer acceptance is still open.

## Testing the complete account lifecycle against a database

I extended the isolated database rehearsal to use the assembled account host through actual local HTTP. Signed login stored encrypted session ownership, refresh advanced its generation, and scoped sign-out removed the session and refused the old cookie. I used synthetic provider responses and removed the disposable database afterward. This gave stronger integration evidence while keeping real customer acceptance separate. All 560 foundation tests also passed.

## Delivering connected account and reset pages

I separated the connected account build from the sample preview and added restricted delivery for its pages and assets. Only the public project origin is inserted into HTML. I tested the real connected reset page over local HTTPS in WebKit, including scanner-safe confirmation, one reset, cleared fields and refusal after reuse. All 565 foundation tests passed. Real hosted email and phone acceptance remain open.

## Preparing deployment without enabling customers

I added bounded build loading and connected it to the complete account application. The loader rejects unexpected files, symlinks, invalid text and oversized builds. Preparing the application starts no provider connection or listener. All 571 foundation tests and the actual connected-page HTTPS WebKit reset journey passed. Network deployment and real customer acceptance remain separate steps.

## Making account startup and shutdown predictable

I added explicit listener startup and bounded shutdown. Account maintenance must pass before a socket opens. Shutdown waits for sockets to close and reports uncertainty when it must force closure or application cleanup is unresolved. Focused tests exposed a timing issue in socket-close reporting, which I fixed. All 578 foundation tests passed, and the connected reset journey also passed over local HTTPS through the network wrapper. Hosted customer acceptance remains open.

## Connecting the browser to the isolated account database

I ran the actual connected pages through HTTPS and WebKit with the complete account application and a disposable PostgreSQL database. Signed login, encrypted refresh storage, refresh and confirmed sign-out passed. Recovery also passed in a separate browser context with no original cookies, with exactly one password update and no reuse after reload. I corrected a test that checked sign-out too early and removed misleading retry advice from an unconfirmed sign-out message. All 578 foundation tests passed. Auth responses remained simulated, so real email and phone acceptance are still open.

## Validating server settings before activation

I prepared strict validation for deployment origins, private server settings and encryption-key configuration. Invalid settings fail with a generic message rather than exposing their contents. I kept sign-in duration as an explicit customer-facing decision, with no silent default. All 583 foundation tests passed. No credential was generated or hosted account setting changed.

## Preparing graceful account shutdown

I added an explicit shutdown helper so deployment can wait for connection cleanup before reporting success. Repeated stop signals share one cleanup operation, and uncertain cleanup stays unconfirmed. Four focused checks and the full 587-test suite pass. This prepares deployment without activating customer accounts or choosing an unapproved sign-in duration.

## Making the reset form consistent

I found that the standalone reset page was missing the shared account form styles. I corrected the wrapper so password fields use readable text, consistent spacing and large controls. I added a regression check and verified the rendered dimensions in desktop WebKit through the complete synthetic reset journey. Physical-phone and screen-reader checks remain open.

## Choosing a fixed sign-in lifetime

I chose seven days from sign-in for customer sessions. Refreshing should not silently extend that deadline. I added a regression-tested guard that prevents refresh ownership from extending the original expiry. Persistent cookies and safe refresh after access-token expiry still need integration before I can claim the complete behavior works.

## Preserving the sign-in deadline in the browser

I connected the trusted server session deadline to secure persistent cookie issuance. The cookie uses only the remaining time and refuses deadlines beyond seven days. The full 590-test suite passes, but safe refresh after access-token expiry and restart acceptance still need integration before the seven-day sign-in feature is complete.

## Refreshing without weakening data access

I added a separate identity check for the refresh endpoint so a signed expired access token can request renewal while the server session and stored refresh ownership remain valid. Expired tokens still cannot authorize customer data or password recovery. Regression checks cover revocation, old tokens and route/origin confinement. Full seven-day browser/database restart acceptance remains to be completed.

## Verifying the session deadline survives server replacement

I made seven days the account host default and verified that the original deadline is captured once. In the combined browser/database rehearsal, I replaced the server and refreshed a signed expired access token. The stored deadline and cookie expiry stayed unchanged, and sign-out still removed the session. Auth responses were synthetic, so real provider and complete browser restoration acceptance remain open.

## Enforcing the stored session deadline for customer data

I prepared a resource-access guard that requires a current signed identity and ready server-held session ownership before customer data can be used. It checks the stored deadline again during reuse and refuses held, missing or expired records. The 598-test suite passes; real route integration and hosted isolation acceptance remain open.

## Proving session expiry blocks resource access

I extended the combined database/browser rehearsal to verify the actual resource guard. Expired and quarantined records blocked access; expired access tokens could refresh without authorizing resources; sign-out invalidated existing resource permission. The checks used disposable data and synthetic Auth, so hosted customer isolation remains a separate gate.

## Preparing safe session restoration

I chose a fixed seven-day sign-in window. I added a status check that reveals no customer details and requires the saved session to remain valid. I prepared one refresh attempt followed by another status check, so an uncertain refresh cannot silently become a successful sign-in. Browser integration and hosted acceptance are still pending.

## Restoring sign-in after reload

I connected the saved-session check to the account screen. I verified reload without unnecessary refresh, then replaced the application and refreshed an expired access token without extending the original seven-day deadline. I protected cancellation and sign-out from late responses. These checks use an isolated database and synthetic Auth responses, so real hosted acceptance remains a separate gate.

## Checking persistence beyond a page reload

I closed and reopened a real WebKit browser profile and confirmed that its saved secure cookie restored sign-in without rotating credentials. I also expired the isolated database session and confirmed that the screen stayed signed out. I kept these results distinct from real customer and iPhone acceptance.

## Making account server startup explicit

I connected configuration, maintenance, account delivery and shutdown into one explicitly started runtime. I kept preparation separate from activation and verified that failed startup and shutdown clean up resources. I fixed a signal-only shutdown case that could otherwise report a successful later start. The real local runtime serves the account page and shuts down cleanly with synthetic maintenance; hosted activation remains pending.

## Establishing trusted account transport

I added a transport boundary that accepts real TLS and refuses to trust an HTTPS header supplied by itself. I prepared a separate HTTPS startup command and tested it with generated certificates. I kept Render proxy verification separate because managed TLS alone does not prove which incoming headers can be trusted. Account and recovery browser checks continue to pass behind the new guard.

## Checking deployment assumptions

I checked Render's own documentation before enabling accounts. I separated documented TLS termination from the unproven header trust and URL logging details, then prepared focused support questions without customer data. I kept real account activation gated while continuing independent preparation.

## Keeping the delivery record consistent

I updated the private project Memory with the tested runtime and transport work. I corrected an older account checklist that still treated my hosted setup and cross-device recovery approvals as pending. I kept those decisions separate from real provider and device checks, which are still required before launch.

## Separating application and provider session policy

I inspected the live account settings without changing them. Email confirmation is on, Google and Apple still need setup, and provider sessions are not time-boxed. I documented that my tested seven-day application deadline is separate from Supabase's provider setting, so the evidence does not overstate hosted readiness.

## Defining account linking before launch

I separated Supabase's automatic linking behavior from its manual-linking switch and prepared a clear MVP policy for review. I added a regression showing that returned email and user metadata never determine application ownership. I kept that narrow evidence separate from real provider security acceptance.


## Choosing account linking, 12 October 2026

I chose Supabase automatic linking so customers using Google or Apple with the same verified email can return to their existing account. I kept manual linking and application-driven merging disabled. My tradeoff is relying on the provider's linking rules while requiring live security checks before activation. Different Apple relay emails are not guaranteed to resolve to the same account. The application still identifies owners by verified identity ID rather than email.


## Deferring the custom domain, 12 October 2026

I decided to delay buying a domain until the app is ready for public launch. The prototype can use a Render-provided website address, so I can avoid an early purchase. I kept verified production email delivery and real account security checks as launch requirements rather than treating the temporary website address as proof that accounts are ready.


## Preventing canceled audio from restarting, 12 October 2026

I found that a local audio sender could reuse an earlier inference identity after interruption. I fixed both senders to reject reused identities and added three regression tests. All 1,276 prototype tests, type checking and the build passed. I kept the distinction between a server speaking event and proof of what the customer heard, so the app does not treat a stopped event as permission to resume old buffered playback. Live recovery remains an acceptance task.


## Preparing safe playback replacement

I separated local playback cleanup from provider shutdown. I added a disposal helper that invalidates old media callbacks, detaches playback and checks that the video client is destroyed. Failure keeps recovery blocked, even though remaining cleanup is still attempted. This helps prevent an old reply from returning, but I have not claimed that it proves provider termination or completed a real replacement-room test. The live prototype still ends on interruption.


I connected the recovery coordinator to the local disposal check. Cleanup now starts before waiting for remote closure, and a new context cannot open until both checks succeed. I tested this coordination with simulated clients, while keeping the live page on interrupt-and-end until real provider and phone acceptance is authorized.


I fixed a cleanup callback edge case: if invalidating old playback requested cleanup again, destruction could start recursively. I installed the shared cleanup result first and added a regression test. I also confirmed that the current model requests are stateless, so a future replacement flow must preserve explicitly confirmed context through a separate lifecycle instead of assuming the existing end action keeps it.


I approved a tightly capped follow-up experiment to test interruption recovery in a replacement room. I chose to reserve both rooms before starting, keep prior attempts unchanged and prohibit retries. This makes the cost boundary explicit while the live cleanup and context behavior still need testing.


I tested the recovery experiment's spending rules in an isolated database before changing the hosted project. The checks show that prior attempts stay unchanged, both new rooms must be reserved together, and the replacement cannot be claimed before the initial room is recorded and closed. These database checks do not substitute for real playback acceptance.


I separated the interruption experiment from the original end-only voice test. The new service copies only replies explicitly confirmed as heard, ends the old room, and refuses the replacement unless closure is verified. Simulated tests cover that lifecycle, but real phone playback remains a separate acceptance step.


I added a separate private recovery page rather than changing the original stop-only test. Its browser must verify local video-client destruction before asking for a replacement, and its server still requires verified old-room closure. The automated suite caught an early return that prevented replacement after restoring history; I fixed it before publishing. A real device test is still needed.


I rehearsed recovery in a phone-sized WebKit browser using simulated media and provider responses. The check exposed an ordering bug: old callbacks were invalidated before their interrupt message could be sent. I moved the interrupt ahead of invalidation and added an assertion before client destruction. The rehearsal covers the UI and cleanup sequence, while the real phone test remains separate.


## Preserving experiment history while enabling recovery

I approved one bounded $4 interruption-and-resume experiment, bringing the experiment allocation to $29. I kept the nine earlier test records intact and checked the full database history before and after applying the allowance. The update enabled the allowance without starting a call. I chose a separate recovery mode so ordinary tests cannot use that budget, and kept live phone acceptance separate from simulated test results.


## Making a bounded test easier to follow

I saw that leaving or refreshing the phone preview could consume a reserved test before I completed the instructions. I added a visible reminder and expandable steps, plus a best-effort browser warning. I kept the existing cleanup because iPhone browsers may skip navigation warnings. I verified the change with 1,299 automated checks and a synthetic mobile WebKit rehearsal. I kept actual recovery acceptance open and did not reuse reserved attempts or increase spending.


## Learning from a real-device failure

My phone test failed after I confirmed the first reply and gave a sleeve preference. I verified that the provider room had ended and the replacement never started. The screen's generic error could not explain the failure, so I added fixed messages that identify the failing stage without retaining speech or exposing provider error bodies. The simulated follow-up and recovery tests pass, but I kept physical-device acceptance open and did not spend on an automatic retry.


## Rehearsing the notebook connection before spending

I connected the prepared private notebook owner to a local browser-controller rehearsal. I checked two completed turns, a budget correction, touch confirmation and shutdown while keeping the test reservation consumed. All 1,454 automated prototype checks passed. I kept these simulated results separate from microphone and live-provider acceptance, and left the proposed additional $2 unapproved.


## Making the notebook trial understandable before starting

I added a separate preparation page with the complete instructions and privacy boundary visible before the local rehearsal. I checked that acknowledgment is required, a $500 budget changes to $350, touch editing confirms the value, and End clears the notebook. The local rehearsal uses no microphone or paid service. I kept the 1,456 automated results and browser checks separate from future live speech acceptance.


## Binding provider work to its reserved experiment

I connected the protected notebook owner to a single disposable provider component. It checks the exact reserved experiment before construction, cancels pending work when stopped, and refuses reuse. My synthetic test verifies that the reservation stays consumed after shutdown. All 1,466 automated prototype tests pass. This preparation does not start a paid call or establish live speech acceptance.


## Waiting for explicit consent before reserving a trial

I added a versioned consent handshake before the prepared notebook connection can reserve a test or create provider transports. Missing, declined or outdated consent and early audio close the connection without consuming an allowance. I verified the valid two-turn flow and rejection cases using local WebSockets. All 1,474 automated prototype tests pass; live microphone testing remains a separate unapproved experiment.


## Keeping simulated evidence separate from private execution

I added an explicit internal execution mode tied to a reserved experiment, rather than letting real protocol work report itself as simulated. I require counted extraction for that mode and keep ended connections held while remote cleanup is uncertain. The checks use synthetic providers and do not authorize a real trial. All 1,486 automated prototype tests pass; the normal server and browser still cannot start this live test.


## Verifying authorization before constructing providers

I connected the notebook owner to its reserved execution capability after consent and access checks. I verified that a mismatched capability or canceled authorization cannot construct a provider, and that the browser rejects readiness for the wrong mode. All 1,498 automated prototype tests pass. I kept the preparation page simulated and made no paid calls or hosted changes.
