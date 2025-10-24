[Admin Docs](/)

***

# Variable: notificationLogsTableRelations

> `const` **notificationLogsTableRelations**: `Relations`\<`"notification_logs"`, \{ `audienceWhereNotification`: `Many`\<`"notification_audience"`\>; `senderUser`: `One`\<`"users"`, `false`\>; `template`: `One`\<`"notification_templates"`, `true`\>; \}\>

Defined in: [src/drizzle/tables/NotificationLog.ts:94](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/drizzle/tables/NotificationLog.ts#L94)
