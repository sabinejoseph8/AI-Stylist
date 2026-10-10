# My AI Stylist project story

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
