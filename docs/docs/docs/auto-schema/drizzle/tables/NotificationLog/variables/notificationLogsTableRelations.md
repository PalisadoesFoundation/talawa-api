[Admin Docs](/)

***

# Variable: notificationLogsTableRelations

> `const` **notificationLogsTableRelations**: `Relations`\<`"notification_logs"`, \{ `audienceWhereNotification`: `Many`\<`"notification_audience"`\>; `senderUser`: `One`\<`"users"`, `false`\>; `template`: `One`\<`"notification_templates"`, `true`\>; \}\>

Defined in: [src/drizzle/tables/NotificationLog.ts:94](https://github.com/Sourya07/talawa-api/blob/2dc82649c98e5346c00cdf926fe1d0bc13ec1544/src/drizzle/tables/NotificationLog.ts#L94)
