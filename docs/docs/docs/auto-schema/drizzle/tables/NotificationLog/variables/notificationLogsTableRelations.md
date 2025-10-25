[Admin Docs](/)

***

# Variable: notificationLogsTableRelations

> `const` **notificationLogsTableRelations**: `Relations`\<`"notification_logs"`, \{ `audienceWhereNotification`: `Many`\<`"notification_audience"`\>; `senderUser`: `One`\<`"users"`, `false`\>; `template`: `One`\<`"notification_templates"`, `true`\>; \}\>

Defined in: [src/drizzle/tables/NotificationLog.ts:94](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/drizzle/tables/NotificationLog.ts#L94)
