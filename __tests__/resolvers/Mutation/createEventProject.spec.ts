import "dotenv/config"
import { Document } from "mongoose"
import {
    Interface_User,
    User,
    Organization,
    Interface_Organization,
    Event,
    Interface_Event,
} from "../../../src/lib/models"
import {nanoid} from "nanoid"
import {connect, disconnect} from "../../../src/db"
import {beforeAll, afterAll, describe, it, expect} from "vitest"
import {createEventProject} from "../../../src/lib/resolvers/Mutation/createEventProject"
import {
    USER_NOT_FOUND,
    EVENT_NOT_FOUND,
    USER_NOT_AUTHORIZED
} from "../../../src/constants"

let testUser: Interface_User & Document<any, any, Interface_User>
let testOrganization: Interface_Organization & Document<any, any, Interface_Organization>
let testAdminUser: Interface_User & Document<any, any, Interface_User>
let testEvent: Interface_Event & Document<any, any, Interface_Event>

beforeAll(async () => {
    await connect()

    testUser = await User.create({
        email: `email${nanoid().toLowerCase()}@gmail.com`,
        password: "password",
        firstName: "firstName",
        lastName: "lastName",
        appLanguageCode: "en",
    })

    testAdminUser = await User.create({
        email: `email${nanoid().toLowerCase()}@gmail.com`,
        password: "password",
        firstName: "firstName",
        lastName: "lastName",
        appLanguageCode: "en",
    })

    testOrganization = await Organization.create({
        name: "name",
        description: "description",
        isPublic: true,
        creator: testUser._id,
        admins: [testAdminUser._id],
        members: [testUser._id, testAdminUser._id],
    })

    testEvent = await Event.create({
        title: "title",
        description: "description",
        allDay: true,
        startDate: new Date(),
        recurring: true,
        isPublic: true,
        isRegisterable: true,
        creator: testUser._id,
        admins: [testAdminUser._id],
        registrants: [],
        organization: testOrganization._id,
    });

    await User.updateOne(
        {
            _id: testUser._id,
        },
        {
            $push: {
                adminFor: testOrganization._id,
            },
        }
    )
})

afterAll(async () => {
    await User.deleteMany({})
    await Organization.deleteMany({})
    await Event.deleteMany({})
    await disconnect()
})

describe('resolvers -> Mutation -> createEventProject', () => {
    it('Should throw an error if the user is not found', async () => {
        const args = {
            data: {
                eventId: null
            }
        }

        expect(async () => {
            await createEventProject(null, args, {user: null})
        }).rejects.toThrowError(USER_NOT_FOUND)
    })
    it('Should throw an error if the event is not found', async () => {
        const args = {
            data: {
                eventId: null
            }
        }

        const context = {
            userId: testUser._id
        }

        expect(async () => {
            await createEventProject(null, args, context)
        }).rejects.toThrowError(EVENT_NOT_FOUND)
    })
    it('Should throw an error if the user is not an admin of the event', async () => {
        const args = {
            data: {
                eventId: testEvent._id
            }
        }

        const context = {
            userId: testUser._id
        }

        expect(async () => {
            await createEventProject(null, args, context)
        }).rejects.toThrowError(USER_NOT_AUTHORIZED)
    })
    it('Should create a project', async () => {
        const context = {
            userId: testAdminUser._id
        }
        const args = {
            data: {
                eventId: testEvent._id,
                title: "title",
                description: "description",
                event: testEvent._id,
                creator: context.userId,
            },
        }


        const result = await createEventProject(null, args, context)

        expect(result).toHaveProperty("event", testEvent._id)
        expect(result).toHaveProperty('title', args.data.title)
        expect(result).toHaveProperty('description', args.data.description)
        expect(result).toHaveProperty('event', testEvent._id)
        expect(result).toHaveProperty('creator', context.userId)
    })
})