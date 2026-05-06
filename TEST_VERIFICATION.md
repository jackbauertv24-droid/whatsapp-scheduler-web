# WhatsApp Scheduler Test Verification

**Test Date**: 2026-05-06
**Test Started**: 08:32 UTC
**Test Type**: Lyric ordering and cross-contamination test

## Test Setup

### Contact Assignments
- **Being (group)**: "Hey Jude" lyrics (10 lines)
- **+852 9777 8901 (contact)**: "Yesterday" lyrics (10 lines)

### Scheduled Messages

| Time (UTC) | Contact | Song | Line |
|------------|---------|------|------|
| 08:32:00 | Being | Hey Jude | "Hey Jude, don't make it bad" |
| 08:32:00 | Being | Hey Jude | "Take a sad song and make it better" |
| 08:32:00 | 9777 | Yesterday | "Yesterday, all my troubles seemed so far away" |
| 08:33:00 | Being | Hey Jude | "Remember to let her into your heart" |
| 08:33:00 | 9777 | Yesterday | "Now it looks as though they're here to stay" |
| 08:34:00 | Being | Hey Jude | "Then you can start to make it better" |
| 08:34:00 | 9777 | Yesterday | "Oh, I believe in yesterday" |
| 08:45:00 | Being | Hey Jude | "Hey Jude, don't be afraid" |
| 08:45:00 | 9777 | Yesterday | "Suddenly, I'm not half the man I used to be" |
| 08:46:00 | Being | Hey Jude | "You were made to go out and get her" |
| 08:46:00 | 9777 | Yesterday | "There's a shadow hanging over me" |
| 09:00:00 | Being | Hey Jude | "The minute you let her under your skin" |
| 09:00:00 | 9777 | Yesterday | "Oh, yesterday came suddenly" |
| 09:01:00 | Being | Hey Jude | "Then you begin to make it better" |
| 09:01:00 | 9777 | Yesterday | "Why she had to go I don't know, she wouldn't say" |
| 09:15:00 | Being | Hey Jude | "And anytime you feel the pain, hey Jude, refrain" |
| 09:15:00 | 9777 | Yesterday | "I said something wrong, now I long for yesterday" |
| 09:16:00 | Being | Hey Jude | "Don't carry the world upon your shoulders" |
| 09:16:00 | 9777 | Yesterday | "Yesterday, love was such an easy game to play" |
| 09:30:00 | 9777 | Yesterday | "Now I need a place to hide away" |

### Test Scenarios

1. **Same moment timing**: 3 messages at 08:32:00 UTC (2 to Being, 1 to 9777)
2. **Close timing**: Messages 1 minute apart (08:33, 08:34)
3. **Distant timing**: Messages 11-14 minutes apart (08:45, 09:00, 09:15, 09:30)
4. **Interleaved contacts**: Both songs scheduled at overlapping times

## Verification Checklist

### Database Verification
```bash
# Check all messages sent
sqlite3 backend/data.db "SELECT status, COUNT(*) FROM messages WHERE scheduled_for >= '2026-05-06T08:32:00.000Z' GROUP BY status"

# Check sent_at timestamps
sqlite3 backend/data.db "SELECT scheduled_for, sent_at, contact_name, content FROM messages WHERE scheduled_for >= '2026-05-06T08:32:00.000Z' ORDER BY sent_at, contact_name"
```

### Scheduler Logs
```bash
# Check processing order
grep "Sending message" backend/logs/scheduler.log
grep "sent successfully" backend/logs/scheduler.log
```

### Expected Results

- [ ] All 20 messages have status = 'sent'
- [ ] All messages have sent_at timestamp populated
- [ ] sent_at timestamps are within 1 minute of scheduled_for
- [ ] Hey Jude lines sent only to "Being" contact
- [ ] Yesterday lines sent only to "+852 9777 8901" contact
- [ ] Lines for each song are in correct order (sequential)
- [ ] No cross-contamination (no mixed lyrics between contacts)
- [ ] No dropped messages (all 20 accounted for)

## Actual Results

### Database Check (Run after test completes)

```
[PASTE RESULTS HERE]
```

### Log Analysis (Run after test completes)

```
[PASTE RESULTS HERE]
```

### Issues Found

```
[DOCUMENT ANY ISSUES HERE]
```

## Analysis Notes

- Messages with same scheduled_for timestamp may be processed in any order
- SingletonLock race condition prevention should prevent concurrent Chrome instances
- isProcessing flag should prevent overlapping scheduler polls
- Expected completion time: ~09:31 UTC (last message at 09:30 + processing time)

---

## Test 2 - Extended Lyric Test (3 Songs, 3 Contacts)

**Test Date**: 2026-05-06
**Test Started**: 10:15 UTC
**Test Type**: Extended lyric ordering test with line numbers

### Test Setup

### Contact Assignments
- **Being (group)**: "Let It Be" lyrics (20 lines with line numbers)
- **+852 9777 8901 (contact)**: "Imagine" lyrics (15 lines with line numbers)
- **+852 9290 8090 (contact)**: "Hotel California" lyrics (40 lines with line numbers)

### Total Messages: 75

### Timing Distribution

**Let It Be (Being) - 20 messages:**
- Start: 10:15 UTC, End: 14:00 UTC
- Same moment: 10:15 (3 messages)
- Close timing: 10:16-10:20 (1-min gaps)
- Medium timing: 10:30-11:30 (15-30 min gaps)
- Distant timing: 12:00-14:00 (15-60 min gaps)

**Imagine (9777) - 15 messages:**
- Start: 10:15 UTC, End: 13:30 UTC
- Same moment: 10:15 (2 messages)
- Close timing: 10:17-10:22 (1-2 min gaps)
- Medium timing: 10:30-12:30 (15-30 min gaps)
- Distant timing: 13:00-13:30 (30 min gaps)

**Hotel California (92908090) - 40 messages:**
- Start: 10:15 UTC, End: 16:00 UTC
- Same moment: 10:15 (3 messages)
- Close timing: 10:16-10:22 (1-min gaps)
- Medium timing: 10:30-11:30 (5-10 min gaps)
- Distant timing: 11:45-16:00 (15-30 min gaps)

### Test Scenarios

1. **Same moment timing**: 8 messages at 10:15:00 UTC across 3 contacts
2. **Close timing**: Messages 1-2 minutes apart (tests rapid sequential processing)
3. **Medium timing**: Messages 5-10 minutes apart (normal scheduling)
4. **Distant timing**: Messages 15-30 minutes apart (long-running test)
5. **Extended duration**: ~6 hours (10:15-16:00 UTC) - tests scheduler stability
6. **Line numbers**: Prevents confusion from repeated lyrics (e.g., "Let it be, let it be" appears 4+ times with different line numbers)

### Verification Commands

```bash
# Check progress
sqlite3 backend/data.db "SELECT contact_name, COUNT(*) as total, SUM(CASE WHEN status='sent' THEN 1 ELSE 0 END) as sent, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending FROM messages WHERE scheduled_for >= '2026-05-06T10:15:00.000Z' GROUP BY contact_name"

# Check ordering per contact
sqlite3 backend/data.db "SELECT sent_at, content FROM messages WHERE contact_name='Being' AND scheduled_for >= '2026-05-06T10:15:00.000Z' ORDER BY sent_at"
sqlite3 backend/data.db "SELECT sent_at, content FROM messages WHERE contact_name='+852 9777 8901' AND scheduled_for >= '2026-05-06T10:15:00.000Z' ORDER BY sent_at"
sqlite3 backend/data.db "SELECT sent_at, content FROM messages WHERE contact_name='+852 9290 8090' AND scheduled_for >= '2026-05-06T10:15:00.000Z' ORDER BY sent_at"

# Check scheduler logs
./check-logs.sh
```

### Expected Results

- [ ] All 75 messages have status = 'sent' by 16:05 UTC
- [ ] All sent_at timestamps are after scheduled_for
- [ ] Line numbers appear in correct sequence (01→02→03→...→40)
- [ ] No cross-contamination between contacts
- [ ] No dropped messages
- [ ] Scheduler handles 6-hour test duration without errors
- [ ] Race condition prevention works for 8 simultaneous messages at 10:15 UTC

### Actual Results

```
[PASTE RESULTS HERE - verify after 16:05 UTC]
```

### Issues Found

```
[DOCUMENT ANY ISSUES HERE]
```

### Analysis Notes

- Test designed to stress scheduler with larger dataset (75 vs 20 messages)
- Extended duration tests long-running stability
- Line numbers added to prevent ordering confusion from repeated lyrics
- New contact (92908090) tests multi-contact handling beyond 2 contacts