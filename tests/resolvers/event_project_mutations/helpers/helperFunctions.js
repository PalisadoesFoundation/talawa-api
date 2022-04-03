const shortid = require('shortid');
const bcrypt = require('bcryptjs');
const User = require('../../../../lib/models/User');
const Organization = require('../../../../lib/models/Organization');
const Event = require('../../../../lib/models/Event');
const EventProject = require('../../../../lib/models/EventProject');

async function createUser() {
  const email = `${shortid.generate().toLowerCase()}@test.com`;
  const hashedPassword = await bcrypt.hash('password', 10);

  const newUser = new User({
    email,
    password: hashedPassword,
    firstName: 'firstName',
    lastName: 'lastName',
    appLanguageCode: 'en',
  });

  const createdUser = await newUser.save();

  return createdUser;
}

async function createOrganization(userId) {
  const name = `test_org_${shortid.generate().toLowerCase()}`;

  const newOrganization = new Organization({
    name,
    description: `test_org_description_${shortid.generate().toLowerCase()}`,
    isPublic: true,
    visibleInSearch: true,
    creator: userId,
    admins: [userId],
    members: [userId],
  });

  const createdOrganization = await newOrganization.save();

  await User.findByIdAndUpdate(userId, {
    $set: {
      joinedOrganizations: [createdOrganization._id],
      createdOrganizations: [createdOrganization._id],
      adminFor: [createdOrganization._id],
    },
  });

  return createdOrganization;
}

async function createEvent(userId, organizationId) {
  const newEvent = new Event({
    title: `test_event_${shortid.generate().toLowerCase()}`,
    description: `testEventDescription_${shortid.generate().toLowerCase()}`,
    startDate: new Date(),
    allDay: true,
    recurring: true,
    isPublic: true,
    isRegisterable: true,
    creator: userId,
    registrants: [
      {
        userId: userId,
        user: userId,
      },
    ],
    admins: [userId],
    organization: organizationId,
  });

  const createdEvent = await newEvent.save();

  await User.findByIdAndUpdate(userId, {
    $push: {
      eventAdmin: createdEvent._id,
      createdEvents: createdEvent._id,
      registeredEvents: createdEvent._id,
    },
  });

  return createdEvent;
}

async function createEventProject(userId, eventId) {
  const newEventProject = new EventProject({
    title: `test_event_project_${shortid.generate().toLowerCase()}`,
    description: `testEventProjectDescription_${shortid
      .generate()
      .toLowerCase()}`,
    event: eventId,
    creator: userId,
  });

  const createdEventProject = await newEventProject.save();

  return createdEventProject;
}

exports.eventProjectTestMutationHelpers = {
  createEventProject,
  createEvent,
  createUser,
  createOrganization,
};
