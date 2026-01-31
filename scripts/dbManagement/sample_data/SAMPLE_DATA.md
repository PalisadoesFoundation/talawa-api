# Sample Data

JSON collection files used to seed the database via `pnpm run add:sample_data`. See [addSampleData.ts](../addSampleData.ts) for the loader.

## Collections (JSON files)

| File | Role |
|------|------|
| `users.json` | Users and auth |
| `organizations.json` | Organizations |
| `organization_memberships.json` | User–organization memberships |
| `posts.json` | Posts |
| `post_votes.json` | Post votes |
| `post_attachments.json` | Post attachments |
| `comments.json` | Comments |
| `membership_requests.json` | Membership requests |
| `comment_votes.json` | Comment votes |
| `action_categories.json` | Action item categories |
| `events.json` | Events (including recurring templates) |
| `recurrence_rules.json` | Recurrence rules for recurring events |
| `recurring_event_instances.json` | Generated instances for recurring events |
| `event_volunteers.json` | Event volunteer records |
| `event_volunteer_memberships.json` | Event volunteer memberships |
| `action_items.json` | Action items |
| `notification_templates.json` | Notification templates |

## Loading sample data

From repo root (or inside the dev container):

```bash
pnpm run add:sample_data
```

This inserts all collections above into the database in dependency order.

## Generating recurring event instances

`recurring_event_instances.json` is **generated** from `events.json` and `recurrence_rules.json`, not edited by hand:

```bash
node scripts/dbManagement/generateRecurringInstances.cjs
```

After regenerating instances, sync `latestInstanceDate` in `recurrence_rules.json` so each rule's last-instance date matches the generated data:

```bash
node scripts/dbManagement/syncLatestInstanceDates.cjs
```
