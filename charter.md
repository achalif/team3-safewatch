# Team Charter — Safewatch

## 1 · Team & Project

**Team name:** Safewatch

**Project (adopted pitch):** Safewatch

**Section:** Tuesday 6:30PM · **TA:** Lidia

**Members:**

| Name | GitHub | Email |
|------|--------|-------|
| Alexander Chalif | achalif |
| Zihao Chen | Lenfried |  
| Yewon Cho (pitcher) | yewon041 |  
| Xiomara Estevez | XiomaraCs |  

### Roles & responsibilities

Roles rotate weekly so nobody becomes "the one who always…". The
**stand-up lead** runs Tuesday's 15 minutes and posts the notes.
The **review captain** is first responder on every PR opened that week
(others can still review — the captain just guarantees nobody waits).**??**
The **demo owner** keeps `main` deployable and runs the team's status
share when it's our turn. Rotation is in the team channel's pinned
message; whoever has it, has it — no swapping without a message.

Standing ownership (from the jigsaw): each member is the first stop for
questions in their aspect above. First stop, not sole owner — anyone can
change anything, but you ask the expert *before* you rewrite their layer.

Everyone, every week: one homework PR merged, one review given, stand-up
attended or an async update posted *before* it starts.

## 2 · The Product

**The problem:** Gun violence and local crime create severe safety risks in U.S. communities, yet residents lack real time, verified incident data to navigate emergencies safely. Existing platforms often rely on delayed news or unverified rumors rather than actionable, live police dispatch data.

**Who it's for:** City residents in the U.S.

**Three core features (the MVP):**

1. Live Incident map: Parses municipal CAD/911 open data feeds to display active police and safety incidents on a real time interactive map. 
2. Background incident notifications: Users can keep the app in the background to receive alerts when an incident is reported.
3. One Tap Emergency Alert: Triggers instant SMS and. push notifications with live GPS coordinates to pre-registered emergency contacts.

**What ships by Week 13 (demo day):** A stranger opens our URL, signs in with GitHub, shares their location data/enters latitude and longitude, the app centers the map on their location and displays all incidents near the user. 

**Out of scope / v2 ideas (Week-9 pitch fodder):** 
Safe Haven Locator: Instantly identifies the nearest police stations, fire departments, and 24/7 public facilities, providing direct navigation routes during emergencies. 
Additional alert types: Implement additional, non-realtime alerts, such as missing person, traffic, weather, etc.

## 3 · Working Agreement

**Where we talk:** `#team-safewatch_tues-630` in the course Slack. 

**Response window:** 24 hours on weekdays, 48 on weekends. "Seen, will answer tonight" counts as a response.

**When we meet (outside class):** Sunday 3PM

**Availability notes:** Alex has Monday evening, Wednesday evening, Saturday classes
Yewon and Zihao have classes on Monday and Wednesdays
Xiomara has classes on Mon, Wed, Fri

**How we decide when we disagree:** Discuss at our next weekly scheduled meeting.

**Definition of done:** Merged into `main` through the gate, CI green,
reviewed by someone who pulled and ran it, and it works at the preview URL
— not "works on my machine."

### Rituals

| Ritual | When | Shape |
|--------|------|-------|
| Stand-up | Sunday 3PM | Each person: merged / in review / blocked. Blockers become a named owner before we hang up. |
| Team review (in class) | Every session, ~15 min of project time | One member's PR on the screen; the four moves (pull it, run it, read it, ask one real question). Comments filed as real review comments. |
| Async check-in | Throughout the week | Slack channel |
| Retro | Midterm (wk 7) + before demo day | The charter gets edited on the spot — that's the output. |
| Planning | After Tuesday class, in Slack | Next week's PRs claimed in the channel by name, one issue each. If you can't name your PR on Sunday, that's the first thing to say at stand-up. |

We use GitHub issues as our board: one issue per PR, assigned to one
person, closed by the merge. If it isn't an issue, it isn't planned.

## 4 · Code & Review Norms

*Completed together at the week-3 kickoff, after our first migration
review.*

**Branch & PR flow:** `main` is protected. Branch from `main` as
`yourname/short-thing`, open a PR early (draft is fine), request the review
captain plus one. Squash-merge; the PR title is the commit message, so
write it like one.

**What blocks approval:** the reviewer couldn't run it; a query that isn't
scoped by the current user; a migration that edits an earlier migration
instead of adding a new one; AI-generated code the author can't explain
when asked. Style never blocks — leave a `nit:` and approve.

**Review response time:** first response within 24 hours on weekdays. If
you can't review in time, say so in the PR so the captain reroutes it —
silence is the only unacceptable answer.

**Comment conventions:** `nit:` (take it or leave it) · `q:` (a real
question — answer before merge) · `blocker:` (must change) · `praise:`
(say what's good; it's how we learn what to repeat). One `blocker:` per
real problem, not a wall of them.

## 5 · AI Working Norms

**Course policy (not optional):** no AI-generated code gets merged unread.
The PR author owns every line they open, wherever it came from. AI
explanations get verified by running the code.

**How we use AI as a team:** as a pair while building and an explainer we verify. Every PR description says which parts were AI-drafted.

**What we never delegate to AI:** the schema and migrations (hand-typed, per kickoff), anything touching user scoping, and the review itself — a reviewer reads the diff, not a summary of it.

**What we build by hand first:** each layer's first instance. The first
endpoint, the first component, the first test in a file are typed; AI
accelerates the second one.

## 6 · When Things Go Wrong

Stuck protocol (course default): 15 minutes stuck → post in the team
thread → still stuck at stand-up → TA → office hours.

**If someone can't deliver on time:** say it in the channel the moment you
know — a Tuesday "I'm not going to make it" is a plan; a Friday silence is
a problem. The review captain redistributes; the missed PR moves to next
week.

## 7 · Commitment

We'll revisit it at midterm and update what isn't working.

| Signed | Date |
|--------|------|
|  | Sep 22, 2026 |
|  | Sep 22, 2026 |
|  | Sep 22, 2026 |
|  | Sep 22, 2026 |