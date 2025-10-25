[Admin Docs](/)

***

# Variable: notificationLogsTableRelations

> `const` **notificationLogsTableRelations**: `Relations`\<`"notification_logs"`, \{ `audienceWhereNotification`: `Many`\<`"notification_audience"`\>; `senderUser`: `One`\<`"users"`, `false`\>; `template`: `One`\<`"notification_templates"`, `true`\>; \}\>

Defined in: [src/drizzle/tables/NotificationLog.ts:94](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/drizzle/tables/NotificationLog.ts#L94)
