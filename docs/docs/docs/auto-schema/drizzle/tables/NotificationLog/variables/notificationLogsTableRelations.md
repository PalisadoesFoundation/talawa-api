[Admin Docs](/)

***

# Variable: notificationLogsTableRelations

> `const` **notificationLogsTableRelations**: `Relations`\<`"notification_logs"`, \{ `audienceWhereNotification`: `Many`\<`"notification_audience"`\>; `senderUser`: `One`\<`"users"`, `false`\>; `template`: `One`\<`"notification_templates"`, `true`\>; \}\>

Defined in: [src/drizzle/tables/NotificationLog.ts:94](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/drizzle/tables/NotificationLog.ts#L94)
