--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: talawa
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO talawa;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: talawa
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO talawa;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: talawa
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO talawa;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: talawa
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: action_categories; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.action_categories (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    description text,
    id uuid NOT NULL,
    is_disabled boolean NOT NULL,
    name text NOT NULL,
    organization_id uuid NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.action_categories OWNER TO talawa;

--
-- Name: actions; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.actions (
    assigned_at timestamp(3) with time zone NOT NULL,
    actor_id uuid,
    category_id uuid,
    completion_at timestamp(3) with time zone NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    event_id uuid,
    id uuid NOT NULL,
    is_completed boolean NOT NULL,
    organization_id uuid NOT NULL,
    post_completion_notes text,
    pre_completion_notes text,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.actions OWNER TO talawa;

--
-- Name: advertisement_attachments; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.advertisement_attachments (
    advertisement_id uuid NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    mime_type text NOT NULL,
    name text NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.advertisement_attachments OWNER TO talawa;

--
-- Name: advertisements; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.advertisements (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    description text,
    end_at timestamp(3) with time zone NOT NULL,
    id uuid NOT NULL,
    name text NOT NULL,
    organization_id uuid NOT NULL,
    start_at timestamp(3) with time zone NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid,
    type text NOT NULL
);


ALTER TABLE public.advertisements OWNER TO talawa;

--
-- Name: agenda_folders; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.agenda_folders (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    event_id uuid NOT NULL,
    id uuid NOT NULL,
    is_agenda_item_folder boolean NOT NULL,
    name text NOT NULL,
    parent_folder_id uuid,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.agenda_folders OWNER TO talawa;

--
-- Name: agenda_items; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.agenda_items (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    description text,
    duration text,
    folder_id uuid NOT NULL,
    id uuid NOT NULL,
    key text,
    name text NOT NULL,
    type text NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.agenda_items OWNER TO talawa;

--
-- Name: chat_memberships; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.chat_memberships (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    chat_id uuid NOT NULL,
    member_id uuid NOT NULL,
    role text NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.chat_memberships OWNER TO talawa;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.chat_messages (
    body text NOT NULL,
    chat_id uuid NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    id uuid NOT NULL,
    parent_message_id uuid,
    updated_at timestamp(3) with time zone
);


ALTER TABLE public.chat_messages OWNER TO talawa;

--
-- Name: chats; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.chats (
    avatar_mime_type text,
    avatar_name text,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    description text,
    id uuid NOT NULL,
    name text NOT NULL,
    organization_id uuid NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.chats OWNER TO talawa;

--
-- Name: comment_votes; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.comment_votes (
    comment_id uuid NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    id uuid NOT NULL,
    type text NOT NULL,
    updated_at timestamp(3) with time zone
);


ALTER TABLE public.comment_votes OWNER TO talawa;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.comments (
    body text NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    id uuid NOT NULL,
    post_id uuid NOT NULL,
    updated_at timestamp(3) with time zone
);


ALTER TABLE public.comments OWNER TO talawa;

--
-- Name: communities; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.communities (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    facebook_url text,
    github_url text,
    id uuid NOT NULL,
    inactivity_timeout_duration integer,
    instagram_url text,
    linkedin_url text,
    logo_mime_type text,
    logo_name text,
    name text NOT NULL,
    reddit_url text,
    slack_url text,
    updated_at timestamp(3) with time zone,
    updater_id uuid,
    website_url text,
    x_url text,
    youtube_url text
);


ALTER TABLE public.communities OWNER TO talawa;

--
-- Name: event_attachments; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.event_attachments (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    event_id uuid NOT NULL,
    mime_type text NOT NULL,
    name text NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.event_attachments OWNER TO talawa;

--
-- Name: event_attendances; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.event_attendances (
    attendee_id uuid NOT NULL,
    check_in_at timestamp(3) with time zone,
    check_out_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    event_id uuid NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.event_attendances OWNER TO talawa;

--
-- Name: events; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.events (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    description text,
    end_at timestamp(3) with time zone NOT NULL,
    id uuid NOT NULL,
    name text NOT NULL,
    organization_id uuid NOT NULL,
    start_at timestamp(3) with time zone NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.events OWNER TO talawa;

--
-- Name: families; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.families (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    id uuid NOT NULL,
    name text NOT NULL,
    organization_id uuid NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.families OWNER TO talawa;

--
-- Name: family_memberships; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.family_memberships (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    family_id uuid NOT NULL,
    member_id uuid NOT NULL,
    role text NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.family_memberships OWNER TO talawa;

--
-- Name: fund_campaign_pledges; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.fund_campaign_pledges (
    amount integer NOT NULL,
    campaign_id uuid NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    id uuid NOT NULL,
    note text,
    pledger_id uuid NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.fund_campaign_pledges OWNER TO talawa;

--
-- Name: fund_campaigns; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.fund_campaigns (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    currency_code text NOT NULL,
    end_at timestamp(3) with time zone NOT NULL,
    fund_id uuid NOT NULL,
    goal_amount integer NOT NULL,
    id uuid NOT NULL,
    name text NOT NULL,
    start_at timestamp(3) with time zone NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.fund_campaigns OWNER TO talawa;

--
-- Name: funds; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.funds (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    id uuid NOT NULL,
    is_tax_deductible boolean NOT NULL,
    name text NOT NULL,
    organization_id uuid NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.funds OWNER TO talawa;

--
-- Name: organization_memberships; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.organization_memberships (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    member_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    role text NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.organization_memberships OWNER TO talawa;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.organizations (
    address_line_1 text,
    address_line_2 text,
    avatar_mime_type text,
    avatar_name text,
    city text,
    country_code text,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    description text,
    id uuid NOT NULL,
    name text NOT NULL,
    postal_code text,
    state text,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.organizations OWNER TO talawa;

--
-- Name: post_attachments; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.post_attachments (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    post_id uuid NOT NULL,
    mime_type text NOT NULL,
    name text NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.post_attachments OWNER TO talawa;

--
-- Name: post_votes; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.post_votes (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    id uuid NOT NULL,
    post_id uuid NOT NULL,
    type text NOT NULL,
    updated_at timestamp(3) with time zone
);


ALTER TABLE public.post_votes OWNER TO talawa;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.posts (
    caption text NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid NOT NULL,
    id uuid NOT NULL,
    organization_id uuid NOT NULL,
    pinned_at timestamp(3) with time zone,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.posts OWNER TO talawa;

--
-- Name: tag_assignments; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.tag_assignments (
    assignee_id uuid NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    tag_id uuid NOT NULL
);


ALTER TABLE public.tag_assignments OWNER TO talawa;

--
-- Name: tag_folders; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.tag_folders (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    id uuid NOT NULL,
    name text NOT NULL,
    organization_id uuid NOT NULL,
    parent_folder_id uuid,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.tag_folders OWNER TO talawa;

--
-- Name: tags; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.tags (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    folder_id uuid,
    id uuid NOT NULL,
    name text NOT NULL,
    organization_id uuid NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.tags OWNER TO talawa;

--
-- Name: users; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.users (
    address_line_1 text,
    address_line_2 text,
    avatar_mime_type text,
    avatar_name text,
    birth_date date,
    city text,
    country_code text,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    description text,
    education_grade text,
    email_address text NOT NULL,
    employment_status text,
    home_phone_number text,
    id uuid NOT NULL,
    is_email_address_verified boolean NOT NULL,
    marital_status text,
    mobile_phone_number text,
    name text NOT NULL,
    natal_sex text,
    natural_language_code text,
    password_hash text NOT NULL,
    postal_code text,
    role text NOT NULL,
    state text,
    updated_at timestamp(3) with time zone,
    updater_id uuid,
    work_phone_number text
);


ALTER TABLE public.users OWNER TO talawa;

--
-- Name: venue_attachments; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.venue_attachments (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    mime_type text NOT NULL,
    name text NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid,
    venue_id uuid NOT NULL
);


ALTER TABLE public.venue_attachments OWNER TO talawa;

--
-- Name: venue_bookings; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.venue_bookings (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    event_id uuid NOT NULL,
    venue_id uuid NOT NULL
);


ALTER TABLE public.venue_bookings OWNER TO talawa;

--
-- Name: venues; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.venues (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    description text,
    id uuid NOT NULL,
    name text NOT NULL,
    organization_id uuid NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.venues OWNER TO talawa;

--
-- Name: volunteer_group_assignments; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.volunteer_group_assignments (
    assignee_id uuid NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    group_id uuid NOT NULL,
    invite_status text NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.volunteer_group_assignments OWNER TO talawa;

--
-- Name: volunteer_groups; Type: TABLE; Schema: public; Owner: talawa
--

CREATE TABLE public.volunteer_groups (
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    creator_id uuid,
    event_id uuid NOT NULL,
    id uuid NOT NULL,
    leader_id uuid,
    max_volunteer_count integer NOT NULL,
    name text NOT NULL,
    updated_at timestamp(3) with time zone,
    updater_id uuid
);


ALTER TABLE public.volunteer_groups OWNER TO talawa;

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: talawa
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: talawa
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	a67d4d14571ae7cf97869acef4eb2ce9a2acfccd7c6cea557a86d3c06c265884	1737537615071
\.


--
-- Data for Name: action_categories; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.action_categories (created_at, creator_id, description, id, is_disabled, name, organization_id, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: actions; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.actions (assigned_at, actor_id, category_id, completion_at, created_at, creator_id, event_id, id, is_completed, organization_id, post_completion_notes, pre_completion_notes, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: advertisement_attachments; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.advertisement_attachments (advertisement_id, created_at, creator_id, mime_type, name, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: advertisements; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.advertisements (created_at, creator_id, description, end_at, id, name, organization_id, start_at, updated_at, updater_id, type) FROM stdin;
\.


--
-- Data for Name: agenda_folders; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.agenda_folders (created_at, creator_id, event_id, id, is_agenda_item_folder, name, parent_folder_id, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: agenda_items; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.agenda_items (created_at, creator_id, description, duration, folder_id, id, key, name, type, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: chat_memberships; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.chat_memberships (created_at, creator_id, chat_id, member_id, role, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.chat_messages (body, chat_id, created_at, creator_id, id, parent_message_id, updated_at) FROM stdin;
\.


--
-- Data for Name: chats; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.chats (avatar_mime_type, avatar_name, created_at, creator_id, description, id, name, organization_id, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: comment_votes; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.comment_votes (comment_id, created_at, creator_id, id, type, updated_at) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.comments (body, created_at, creator_id, id, post_id, updated_at) FROM stdin;
\.


--
-- Data for Name: communities; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.communities (created_at, facebook_url, github_url, id, inactivity_timeout_duration, instagram_url, linkedin_url, logo_mime_type, logo_name, name, reddit_url, slack_url, updated_at, updater_id, website_url, x_url, youtube_url) FROM stdin;
2025-01-24 15:17:40.881+00	https://facebook.com	https://github.com	019498e3-e990-7cfb-aca7-ff7920f1068d	900	https://instagram.com	https://linkedin.com	\N	\N	talawa	https://reddit.com	https://slack.com	\N	\N	https://docs.talawa.com	https://x.com	https://youtube.com
\.


--
-- Data for Name: event_attachments; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.event_attachments (created_at, creator_id, event_id, mime_type, name, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: event_attendances; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.event_attendances (attendee_id, check_in_at, check_out_at, created_at, creator_id, event_id, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.events (created_at, creator_id, description, end_at, id, name, organization_id, start_at, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: families; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.families (created_at, creator_id, id, name, organization_id, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: family_memberships; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.family_memberships (created_at, creator_id, family_id, member_id, role, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: fund_campaign_pledges; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.fund_campaign_pledges (amount, campaign_id, created_at, creator_id, id, note, pledger_id, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: fund_campaigns; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.fund_campaigns (created_at, creator_id, currency_code, end_at, fund_id, goal_amount, id, name, start_at, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: funds; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.funds (created_at, creator_id, id, is_tax_deductible, name, organization_id, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: organization_memberships; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.organization_memberships (created_at, creator_id, member_id, organization_id, role, updated_at, updater_id) FROM stdin;
2025-01-26 15:01:25.58+00	019498e3-e951-7066-bc66-c1e88d04ff1d	019498e3-e951-7066-bc66-c1e88d04ff1d	0194a314-49c7-703e-9f4e-3422dd4f65fe	administrator	\N	\N
2025-01-30 01:31:43.619+00	019498e3-e951-7066-bc66-c1e88d04ff1d	0194b4cc-b299-728f-8ffa-3e2ea68d7949	0194b4ca-4a89-74a1-96f6-ae51454b414c	administrator	\N	\N
2025-02-01 04:17:56.839+00	019498e3-e951-7066-bc66-c1e88d04ff1d	0194afbc-add6-7109-8fad-b25aadd86e3b	0194a314-49c7-703e-9f4e-3422dd4f65fe	administrator	\N	\N
2025-02-01 04:18:28.825+00	019498e3-e951-7066-bc66-c1e88d04ff1d	0194afbc-add6-7109-8fad-b25aadd86e3b	0194a33a-d990-73df-a220-c60d4b82be96	administrator	\N	\N
2025-02-01 04:19:01.742+00	019498e3-e951-7066-bc66-c1e88d04ff1d	0194afbc-add6-7109-8fad-b25aadd86e3b	0194a42a-29fa-7404-a73c-a6e11ab16118	administrator	\N	\N
2025-02-01 04:20:09.767+00	019498e3-e951-7066-bc66-c1e88d04ff1d	0194b00c-d51a-73dc-bc92-b6e48238acae	0194a42a-3cb7-7ea6-ad8a-fedacffebdfe	administrator	\N	\N
2025-02-01 04:21:42.695+00	019498e3-e951-7066-bc66-c1e88d04ff1d	0194b4cc-b299-728f-8ffa-3e2ea68d7949	0194a42a-3cb7-7ea6-ad8a-fedacffebdfe	administrator	\N	\N
2025-02-01 04:23:27.264+00	019498e3-e951-7066-bc66-c1e88d04ff1d	0194bfb3-09e8-7255-a3af-d6e388ecbbbc	0194a314-49c7-703e-9f4e-3422dd4f65fe	administrator	\N	\N
2025-02-01 04:23:37.357+00	019498e3-e951-7066-bc66-c1e88d04ff1d	0194bfb3-09e8-7255-a3af-d6e388ecbbbc	0194a33a-d990-73df-a220-c60d4b82be96	administrator	\N	\N
2025-02-01 04:23:47.511+00	019498e3-e951-7066-bc66-c1e88d04ff1d	0194bfb3-09e8-7255-a3af-d6e388ecbbbc	0194a42a-29fa-7404-a73c-a6e11ab16118	administrator	\N	\N
2025-02-01 04:24:10.814+00	019498e3-e951-7066-bc66-c1e88d04ff1d	0194bfb3-84ac-7132-a844-39e565afedff	0194a42a-29fa-7404-a73c-a6e11ab16118	administrator	\N	\N
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.organizations (address_line_1, address_line_2, avatar_mime_type, avatar_name, city, country_code, created_at, creator_id, description, id, name, postal_code, state, updated_at, updater_id) FROM stdin;
Andheri	Marol	\N	\N	Mumbai	in	2025-01-26 14:46:43.394+00	019498e3-e951-7066-bc66-c1e88d04ff1d	testing	0194a314-49c7-703e-9f4e-3422dd4f65fe	Test Org 1	876876	Maharashtra	\N	\N
Andheri	Marol	\N	\N	Mumbai	in	2025-01-26 15:28:50.574+00	019498e3-e951-7066-bc66-c1e88d04ff1d	testing	0194a33a-d990-73df-a220-c60d4b82be96	Test Org 2	876876	Maharashtra	\N	\N
Andheri	Marol	\N	\N	Mumbai	in	2025-01-26 19:50:14.257+00	019498e3-e951-7066-bc66-c1e88d04ff1d	testing	0194a42a-29fa-7404-a73c-a6e11ab16118	Test Org 3	876876	Maharashtra	\N	\N
Andheri	Marol	\N	\N	Mumbai	in	2025-01-26 19:50:19.063+00	019498e3-e951-7066-bc66-c1e88d04ff1d	testing	0194a42a-3cb7-7ea6-ad8a-fedacffebdfe	Test Org 5	876876	Maharashtra	\N	\N
Andheri	Marol	\N	\N	Mumbai	in	2025-01-26 19:50:26.85+00	019498e3-e951-7066-bc66-c1e88d04ff1d	testing	0194a42a-5b22-79a7-be3e-0162ddb5a172	Test Org 6	876876	Maharashtra	\N	\N
Los Angeles	USA	\N	\N	Los Angeles	in	2025-01-30 01:19:03.813+00	019498e3-e951-7066-bc66-c1e88d04ff1d	testing	0194b4ca-4a89-74a1-96f6-ae51454b414c	Test Org 7	876876	California	\N	\N
Los Angeles	LA	\N	\N	Los Angeles	in	2025-01-30 17:38:04.125+00	\N	testing	0194b84a-98dd-7f9e-93ac-ee67ea7f4c2b	Test Org 9	876876	California	2025-01-30 18:37:39.679+00	\N
Andheri	Saki Naka East	\N	\N	Mumbai	in	2025-01-26 19:50:00.051+00	019498e3-e951-7066-bc66-c1e88d04ff1d	testing	0194a429-f277-7176-a0b0-63f33a4ce4ca	Test Org 4	876876	Maharashtra	2025-01-30 18:11:40.902+00	\N
\.


--
-- Data for Name: post_attachments; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.post_attachments (created_at, creator_id, post_id, mime_type, name, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: post_votes; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.post_votes (created_at, creator_id, id, post_id, type, updated_at) FROM stdin;
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.posts (caption, created_at, creator_id, id, organization_id, pinned_at, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: tag_assignments; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.tag_assignments (assignee_id, created_at, creator_id, tag_id) FROM stdin;
\.


--
-- Data for Name: tag_folders; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.tag_folders (created_at, creator_id, id, name, organization_id, parent_folder_id, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.tags (created_at, creator_id, folder_id, id, name, organization_id, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.users (address_line_1, address_line_2, avatar_mime_type, avatar_name, birth_date, city, country_code, created_at, creator_id, description, education_grade, email_address, employment_status, home_phone_number, id, is_email_address_verified, marital_status, mobile_phone_number, name, natal_sex, natural_language_code, password_hash, postal_code, role, state, updated_at, updater_id, work_phone_number) FROM stdin;
\N	\N	\N	\N	\N	\N	\N	2025-01-24 15:17:40.872+00	019498e3-e951-7066-bc66-c1e88d04ff1d	\N	\N	administrator@email.com	\N	\N	019498e3-e951-7066-bc66-c1e88d04ff1d	t	\N	\N	administrator	\N	\N	$argon2id$v=19$m=19456,t=2,p=1$Lxyej+9yXi6Tao7IR8LLoQ$uvCYE17R1vzjuqUsxKvKvDnhtjLuhk+EkYyO9fs8eLY	\N	administrator	\N	\N	\N	\N
\N	\N	\N	\N	\N	\N	\N	2025-01-29 01:46:05.661+00	0194afbc-add6-7109-8fad-b25aadd86e3b	\N	\N	testadmin1@email.com	\N	\N	0194afbc-add6-7109-8fad-b25aadd86e3b	f	\N	\N	Test Admin	\N	\N	$argon2id$v=19$m=19456,t=2,p=1$TikYiFJUihAFpUHJ/AW5Gg$NRDbBPst+JlHzceBd/UsUNqTmyp6MuFXSKAXYzmeZfg	\N	administrator	\N	\N	\N	\N
\N	\N	\N	\N	\N	\N	\N	2025-01-29 03:13:38.603+00	0194b00c-d51a-73dc-bc92-b6e48238acae	\N	\N	testadmin2@email.com	\N	\N	0194b00c-d51a-73dc-bc92-b6e48238acae	f	\N	\N	Test Admin Two	\N	\N	$argon2id$v=19$m=19456,t=2,p=1$ST4TOkCdBQJhi3agdTA5xQ$KD2VVO1YNfOE67yfsYH2oPb8aAPsjtw3dTZpPJ4GXSc	\N	administrator	\N	2025-01-29 03:14:43.536+00	019498e3-e951-7066-bc66-c1e88d04ff1d	\N
\N	\N	\N	\N	\N	\N	\N	2025-01-30 01:21:41.53+00	0194b4cc-b299-728f-8ffa-3e2ea68d7949	\N	\N	testadmin3@email.com	\N	\N	0194b4cc-b299-728f-8ffa-3e2ea68d7949	f	\N	\N	Test Admin Three	\N	\N	$argon2id$v=19$m=19456,t=2,p=1$YV30aATtCAyvNx2qXp+YFw$yy1pJ4+qOZjxczTZKpL8NaeHnutMdUocN2YHi5kk4Mc	\N	administrator	\N	2025-01-30 01:25:13.252+00	019498e3-e951-7066-bc66-c1e88d04ff1d	\N
\N	\N	\N	\N	\N	\N	\N	2025-02-01 04:09:29.321+00	0194bfb3-09e8-7255-a3af-d6e388ecbbbc	\N	\N	testuser1@email.com	\N	\N	0194bfb3-09e8-7255-a3af-d6e388ecbbbc	f	\N	\N	Test User One	\N	\N	$argon2id$v=19$m=19456,t=2,p=1$a3PDGwqJyeF5dLpJhZbOsg$M1KvaZU0zKrRsozHvnKY79Nmg3J0Th6Aya+pL/rLMqM	\N	regular	\N	\N	\N	\N
\N	\N	\N	\N	\N	\N	\N	2025-02-01 04:10:00.749+00	0194bfb3-84ac-7132-a844-39e565afedff	\N	\N	testuser2@email.com	\N	\N	0194bfb3-84ac-7132-a844-39e565afedff	f	\N	\N	Test User Two	\N	\N	$argon2id$v=19$m=19456,t=2,p=1$EMNQuXtv4L3XKnCvEYOWCQ$yP81KvOADwHEGZv8cZ/lImJyDO3frszOZo+ZzowKF9w	\N	regular	\N	\N	\N	\N
\N	\N	\N	\N	\N	\N	\N	2025-02-01 04:10:12.477+00	0194bfb3-b27c-7bbe-917f-2a62fc6776b3	\N	\N	testuser3@email.com	\N	\N	0194bfb3-b27c-7bbe-917f-2a62fc6776b3	f	\N	\N	Test User Three	\N	\N	$argon2id$v=19$m=19456,t=2,p=1$B+MBifmVz3vxvo4EYZVujw$qjXlYaqZS3BqLfL6/M6gOEodBY7oYQG/FhPSXNW2+04	\N	regular	\N	\N	\N	\N
\.


--
-- Data for Name: venue_attachments; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.venue_attachments (created_at, creator_id, mime_type, name, updated_at, updater_id, venue_id) FROM stdin;
\.


--
-- Data for Name: venue_bookings; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.venue_bookings (created_at, creator_id, event_id, venue_id) FROM stdin;
\.


--
-- Data for Name: venues; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.venues (created_at, creator_id, description, id, name, organization_id, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: volunteer_group_assignments; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.volunteer_group_assignments (assignee_id, created_at, creator_id, group_id, invite_status, updated_at, updater_id) FROM stdin;
\.


--
-- Data for Name: volunteer_groups; Type: TABLE DATA; Schema: public; Owner: talawa
--

COPY public.volunteer_groups (created_at, creator_id, event_id, id, leader_id, max_volunteer_count, name, updated_at, updater_id) FROM stdin;
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: talawa
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: talawa
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: action_categories action_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.action_categories
    ADD CONSTRAINT action_categories_pkey PRIMARY KEY (id);


--
-- Name: actions actions_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_pkey PRIMARY KEY (id);


--
-- Name: advertisements advertisements_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.advertisements
    ADD CONSTRAINT advertisements_pkey PRIMARY KEY (id);


--
-- Name: agenda_folders agenda_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.agenda_folders
    ADD CONSTRAINT agenda_folders_pkey PRIMARY KEY (id);


--
-- Name: agenda_items agenda_items_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.agenda_items
    ADD CONSTRAINT agenda_items_pkey PRIMARY KEY (id);


--
-- Name: chat_memberships chat_memberships_chat_id_member_id_pk; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.chat_memberships
    ADD CONSTRAINT chat_memberships_chat_id_member_id_pk PRIMARY KEY (chat_id, member_id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chats chats_name_unique; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_name_unique UNIQUE (name);


--
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);


--
-- Name: comment_votes comment_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.comment_votes
    ADD CONSTRAINT comment_votes_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: communities communities_name_unique; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_name_unique UNIQUE (name);


--
-- Name: communities communities_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: families families_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.families
    ADD CONSTRAINT families_pkey PRIMARY KEY (id);


--
-- Name: family_memberships family_memberships_family_id_member_id_pk; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.family_memberships
    ADD CONSTRAINT family_memberships_family_id_member_id_pk PRIMARY KEY (family_id, member_id);


--
-- Name: fund_campaign_pledges fund_campaign_pledges_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.fund_campaign_pledges
    ADD CONSTRAINT fund_campaign_pledges_pkey PRIMARY KEY (id);


--
-- Name: fund_campaigns fund_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.fund_campaigns
    ADD CONSTRAINT fund_campaigns_pkey PRIMARY KEY (id);


--
-- Name: funds funds_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.funds
    ADD CONSTRAINT funds_pkey PRIMARY KEY (id);


--
-- Name: organization_memberships organization_memberships_member_id_organization_id_pk; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_member_id_organization_id_pk PRIMARY KEY (member_id, organization_id);


--
-- Name: organizations organizations_name_unique; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_name_unique UNIQUE (name);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: post_votes post_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.post_votes
    ADD CONSTRAINT post_votes_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: tag_assignments tag_assignments_assignee_id_tag_id_pk; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.tag_assignments
    ADD CONSTRAINT tag_assignments_assignee_id_tag_id_pk PRIMARY KEY (assignee_id, tag_id);


--
-- Name: tag_folders tag_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.tag_folders
    ADD CONSTRAINT tag_folders_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: users users_email_address_unique; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_address_unique UNIQUE (email_address);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: venue_bookings venue_bookings_event_id_venue_id_pk; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.venue_bookings
    ADD CONSTRAINT venue_bookings_event_id_venue_id_pk PRIMARY KEY (event_id, venue_id);


--
-- Name: venues venues_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_pkey PRIMARY KEY (id);


--
-- Name: volunteer_group_assignments volunteer_group_assignments_assignee_id_group_id_pk; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.volunteer_group_assignments
    ADD CONSTRAINT volunteer_group_assignments_assignee_id_group_id_pk PRIMARY KEY (assignee_id, group_id);


--
-- Name: volunteer_groups volunteer_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.volunteer_groups
    ADD CONSTRAINT volunteer_groups_pkey PRIMARY KEY (id);


--
-- Name: action_categories_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX action_categories_created_at_index ON public.action_categories USING btree (created_at);


--
-- Name: action_categories_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX action_categories_creator_id_index ON public.action_categories USING btree (creator_id);


--
-- Name: action_categories_name_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX action_categories_name_index ON public.action_categories USING btree (name);


--
-- Name: action_categories_name_organization_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE UNIQUE INDEX action_categories_name_organization_id_index ON public.action_categories USING btree (name, organization_id);


--
-- Name: actions_actor_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX actions_actor_id_index ON public.actions USING btree (actor_id);


--
-- Name: actions_assigned_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX actions_assigned_at_index ON public.actions USING btree (assigned_at);


--
-- Name: actions_category_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX actions_category_id_index ON public.actions USING btree (category_id);


--
-- Name: actions_completion_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX actions_completion_at_index ON public.actions USING btree (completion_at);


--
-- Name: actions_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX actions_created_at_index ON public.actions USING btree (created_at);


--
-- Name: actions_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX actions_creator_id_index ON public.actions USING btree (creator_id);


--
-- Name: actions_organization_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX actions_organization_id_index ON public.actions USING btree (organization_id);


--
-- Name: advertisement_attachments_advertisement_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX advertisement_attachments_advertisement_id_index ON public.advertisement_attachments USING btree (advertisement_id);


--
-- Name: advertisement_attachments_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX advertisement_attachments_created_at_index ON public.advertisement_attachments USING btree (created_at);


--
-- Name: advertisement_attachments_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX advertisement_attachments_creator_id_index ON public.advertisement_attachments USING btree (creator_id);


--
-- Name: advertisements_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX advertisements_creator_id_index ON public.advertisements USING btree (creator_id);


--
-- Name: advertisements_end_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX advertisements_end_at_index ON public.advertisements USING btree (end_at);


--
-- Name: advertisements_name_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX advertisements_name_index ON public.advertisements USING btree (name);


--
-- Name: advertisements_name_organization_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE UNIQUE INDEX advertisements_name_organization_id_index ON public.advertisements USING btree (name, organization_id);


--
-- Name: advertisements_organization_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX advertisements_organization_id_index ON public.advertisements USING btree (organization_id);


--
-- Name: advertisements_start_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX advertisements_start_at_index ON public.advertisements USING btree (start_at);


--
-- Name: agenda_folders_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX agenda_folders_created_at_index ON public.agenda_folders USING btree (created_at);


--
-- Name: agenda_folders_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX agenda_folders_creator_id_index ON public.agenda_folders USING btree (creator_id);


--
-- Name: agenda_folders_event_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX agenda_folders_event_id_index ON public.agenda_folders USING btree (event_id);


--
-- Name: agenda_folders_is_agenda_item_folder_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX agenda_folders_is_agenda_item_folder_index ON public.agenda_folders USING btree (is_agenda_item_folder);


--
-- Name: agenda_folders_name_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX agenda_folders_name_index ON public.agenda_folders USING btree (name);


--
-- Name: agenda_folders_parent_folder_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX agenda_folders_parent_folder_id_index ON public.agenda_folders USING btree (parent_folder_id);


--
-- Name: agenda_items_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX agenda_items_created_at_index ON public.agenda_items USING btree (created_at);


--
-- Name: agenda_items_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX agenda_items_creator_id_index ON public.agenda_items USING btree (creator_id);


--
-- Name: agenda_items_folder_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX agenda_items_folder_id_index ON public.agenda_items USING btree (folder_id);


--
-- Name: agenda_items_name_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX agenda_items_name_index ON public.agenda_items USING btree (name);


--
-- Name: agenda_items_type_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX agenda_items_type_index ON public.agenda_items USING btree (type);


--
-- Name: chat_memberships_chat_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX chat_memberships_chat_id_index ON public.chat_memberships USING btree (chat_id);


--
-- Name: chat_memberships_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX chat_memberships_created_at_index ON public.chat_memberships USING btree (created_at);


--
-- Name: chat_memberships_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX chat_memberships_creator_id_index ON public.chat_memberships USING btree (creator_id);


--
-- Name: chat_memberships_member_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX chat_memberships_member_id_index ON public.chat_memberships USING btree (member_id);


--
-- Name: chat_memberships_role_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX chat_memberships_role_index ON public.chat_memberships USING btree (role);


--
-- Name: chat_messages_chat_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX chat_messages_chat_id_index ON public.chat_messages USING btree (chat_id);


--
-- Name: chat_messages_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX chat_messages_created_at_index ON public.chat_messages USING btree (created_at);


--
-- Name: chat_messages_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX chat_messages_creator_id_index ON public.chat_messages USING btree (creator_id);


--
-- Name: chat_messages_parent_message_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX chat_messages_parent_message_id_index ON public.chat_messages USING btree (parent_message_id);


--
-- Name: chats_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX chats_creator_id_index ON public.chats USING btree (creator_id);


--
-- Name: chats_name_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX chats_name_index ON public.chats USING btree (name);


--
-- Name: chats_organization_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX chats_organization_id_index ON public.chats USING btree (organization_id);


--
-- Name: chats_updater_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX chats_updater_id_index ON public.chats USING btree (updater_id);


--
-- Name: comment_votes_comment_id_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE UNIQUE INDEX comment_votes_comment_id_creator_id_index ON public.comment_votes USING btree (comment_id, creator_id);


--
-- Name: comment_votes_comment_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX comment_votes_comment_id_index ON public.comment_votes USING btree (comment_id);


--
-- Name: comment_votes_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX comment_votes_creator_id_index ON public.comment_votes USING btree (creator_id);


--
-- Name: comment_votes_type_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX comment_votes_type_index ON public.comment_votes USING btree (type);


--
-- Name: comments_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX comments_created_at_index ON public.comments USING btree (created_at);


--
-- Name: comments_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX comments_creator_id_index ON public.comments USING btree (creator_id);


--
-- Name: comments_post_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX comments_post_id_index ON public.comments USING btree (post_id);


--
-- Name: event_attachments_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX event_attachments_created_at_index ON public.event_attachments USING btree (created_at);


--
-- Name: event_attachments_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX event_attachments_creator_id_index ON public.event_attachments USING btree (creator_id);


--
-- Name: event_attachments_event_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX event_attachments_event_id_index ON public.event_attachments USING btree (event_id);


--
-- Name: event_attendances_attendee_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX event_attendances_attendee_id_index ON public.event_attendances USING btree (attendee_id);


--
-- Name: event_attendances_check_in_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX event_attendances_check_in_at_index ON public.event_attendances USING btree (check_in_at);


--
-- Name: event_attendances_check_out_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX event_attendances_check_out_at_index ON public.event_attendances USING btree (check_out_at);


--
-- Name: event_attendances_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX event_attendances_created_at_index ON public.event_attendances USING btree (created_at);


--
-- Name: event_attendances_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX event_attendances_creator_id_index ON public.event_attendances USING btree (creator_id);


--
-- Name: event_attendances_event_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX event_attendances_event_id_index ON public.event_attendances USING btree (event_id);


--
-- Name: events_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX events_created_at_index ON public.events USING btree (created_at);


--
-- Name: events_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX events_creator_id_index ON public.events USING btree (creator_id);


--
-- Name: events_end_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX events_end_at_index ON public.events USING btree (end_at);


--
-- Name: events_name_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX events_name_index ON public.events USING btree (name);


--
-- Name: events_organization_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX events_organization_id_index ON public.events USING btree (organization_id);


--
-- Name: events_start_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX events_start_at_index ON public.events USING btree (start_at);


--
-- Name: families_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX families_created_at_index ON public.families USING btree (created_at);


--
-- Name: families_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX families_creator_id_index ON public.families USING btree (creator_id);


--
-- Name: families_name_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX families_name_index ON public.families USING btree (name);


--
-- Name: families_name_organization_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE UNIQUE INDEX families_name_organization_id_index ON public.families USING btree (name, organization_id);


--
-- Name: families_organization_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX families_organization_id_index ON public.families USING btree (organization_id);


--
-- Name: family_memberships_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX family_memberships_created_at_index ON public.family_memberships USING btree (created_at);


--
-- Name: family_memberships_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX family_memberships_creator_id_index ON public.family_memberships USING btree (creator_id);


--
-- Name: family_memberships_family_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX family_memberships_family_id_index ON public.family_memberships USING btree (family_id);


--
-- Name: family_memberships_member_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX family_memberships_member_id_index ON public.family_memberships USING btree (member_id);


--
-- Name: fund_campaign_pledges_campaign_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX fund_campaign_pledges_campaign_id_index ON public.fund_campaign_pledges USING btree (campaign_id);


--
-- Name: fund_campaign_pledges_campaign_id_pledger_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE UNIQUE INDEX fund_campaign_pledges_campaign_id_pledger_id_index ON public.fund_campaign_pledges USING btree (campaign_id, pledger_id);


--
-- Name: fund_campaign_pledges_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX fund_campaign_pledges_created_at_index ON public.fund_campaign_pledges USING btree (created_at);


--
-- Name: fund_campaign_pledges_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX fund_campaign_pledges_creator_id_index ON public.fund_campaign_pledges USING btree (creator_id);


--
-- Name: fund_campaign_pledges_pledger_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX fund_campaign_pledges_pledger_id_index ON public.fund_campaign_pledges USING btree (pledger_id);


--
-- Name: fund_campaigns_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX fund_campaigns_created_at_index ON public.fund_campaigns USING btree (created_at);


--
-- Name: fund_campaigns_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX fund_campaigns_creator_id_index ON public.fund_campaigns USING btree (creator_id);


--
-- Name: fund_campaigns_end_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX fund_campaigns_end_at_index ON public.fund_campaigns USING btree (end_at);


--
-- Name: fund_campaigns_fund_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX fund_campaigns_fund_id_index ON public.fund_campaigns USING btree (fund_id);


--
-- Name: fund_campaigns_fund_id_name_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE UNIQUE INDEX fund_campaigns_fund_id_name_index ON public.fund_campaigns USING btree (fund_id, name);


--
-- Name: fund_campaigns_name_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX fund_campaigns_name_index ON public.fund_campaigns USING btree (name);


--
-- Name: fund_campaigns_start_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX fund_campaigns_start_at_index ON public.fund_campaigns USING btree (start_at);


--
-- Name: funds_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX funds_created_at_index ON public.funds USING btree (created_at);


--
-- Name: funds_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX funds_creator_id_index ON public.funds USING btree (creator_id);


--
-- Name: funds_name_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX funds_name_index ON public.funds USING btree (name);


--
-- Name: funds_name_organization_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE UNIQUE INDEX funds_name_organization_id_index ON public.funds USING btree (name, organization_id);


--
-- Name: funds_organization_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX funds_organization_id_index ON public.funds USING btree (organization_id);


--
-- Name: organization_memberships_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX organization_memberships_created_at_index ON public.organization_memberships USING btree (created_at);


--
-- Name: organization_memberships_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX organization_memberships_creator_id_index ON public.organization_memberships USING btree (creator_id);


--
-- Name: organization_memberships_member_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX organization_memberships_member_id_index ON public.organization_memberships USING btree (member_id);


--
-- Name: organization_memberships_organization_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX organization_memberships_organization_id_index ON public.organization_memberships USING btree (organization_id);


--
-- Name: organization_memberships_role_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX organization_memberships_role_index ON public.organization_memberships USING btree (role);


--
-- Name: organizations_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX organizations_creator_id_index ON public.organizations USING btree (creator_id);


--
-- Name: organizations_name_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX organizations_name_index ON public.organizations USING btree (name);


--
-- Name: organizations_updater_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX organizations_updater_id_index ON public.organizations USING btree (updater_id);


--
-- Name: post_attachments_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX post_attachments_created_at_index ON public.post_attachments USING btree (created_at);


--
-- Name: post_attachments_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX post_attachments_creator_id_index ON public.post_attachments USING btree (creator_id);


--
-- Name: post_attachments_post_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX post_attachments_post_id_index ON public.post_attachments USING btree (post_id);


--
-- Name: post_votes_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX post_votes_creator_id_index ON public.post_votes USING btree (creator_id);


--
-- Name: post_votes_creator_id_post_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE UNIQUE INDEX post_votes_creator_id_post_id_index ON public.post_votes USING btree (creator_id, post_id);


--
-- Name: post_votes_post_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX post_votes_post_id_index ON public.post_votes USING btree (post_id);


--
-- Name: post_votes_type_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX post_votes_type_index ON public.post_votes USING btree (type);


--
-- Name: posts_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX posts_created_at_index ON public.posts USING btree (created_at);


--
-- Name: posts_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX posts_creator_id_index ON public.posts USING btree (creator_id);


--
-- Name: posts_organization_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX posts_organization_id_index ON public.posts USING btree (organization_id);


--
-- Name: posts_pinned_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX posts_pinned_at_index ON public.posts USING btree (pinned_at);


--
-- Name: tag_assignments_assignee_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX tag_assignments_assignee_id_index ON public.tag_assignments USING btree (assignee_id);


--
-- Name: tag_assignments_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX tag_assignments_created_at_index ON public.tag_assignments USING btree (created_at);


--
-- Name: tag_assignments_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX tag_assignments_creator_id_index ON public.tag_assignments USING btree (creator_id);


--
-- Name: tag_assignments_tag_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX tag_assignments_tag_id_index ON public.tag_assignments USING btree (tag_id);


--
-- Name: tag_folders_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX tag_folders_created_at_index ON public.tag_folders USING btree (created_at);


--
-- Name: tag_folders_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX tag_folders_creator_id_index ON public.tag_folders USING btree (creator_id);


--
-- Name: tag_folders_name_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX tag_folders_name_index ON public.tag_folders USING btree (name);


--
-- Name: tag_folders_organization_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX tag_folders_organization_id_index ON public.tag_folders USING btree (organization_id);


--
-- Name: tag_folders_parent_folder_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX tag_folders_parent_folder_id_index ON public.tag_folders USING btree (parent_folder_id);


--
-- Name: tags_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX tags_creator_id_index ON public.tags USING btree (creator_id);


--
-- Name: tags_name_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX tags_name_index ON public.tags USING btree (name);


--
-- Name: tags_name_organization_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE UNIQUE INDEX tags_name_organization_id_index ON public.tags USING btree (name, organization_id);


--
-- Name: tags_organization_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX tags_organization_id_index ON public.tags USING btree (organization_id);


--
-- Name: users_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX users_creator_id_index ON public.users USING btree (creator_id);


--
-- Name: users_name_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX users_name_index ON public.users USING btree (name);


--
-- Name: users_updater_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX users_updater_id_index ON public.users USING btree (updater_id);


--
-- Name: venue_attachments_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX venue_attachments_created_at_index ON public.venue_attachments USING btree (created_at);


--
-- Name: venue_attachments_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX venue_attachments_creator_id_index ON public.venue_attachments USING btree (creator_id);


--
-- Name: venue_attachments_venue_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX venue_attachments_venue_id_index ON public.venue_attachments USING btree (venue_id);


--
-- Name: venue_bookings_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX venue_bookings_created_at_index ON public.venue_bookings USING btree (created_at);


--
-- Name: venue_bookings_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX venue_bookings_creator_id_index ON public.venue_bookings USING btree (creator_id);


--
-- Name: venue_bookings_event_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX venue_bookings_event_id_index ON public.venue_bookings USING btree (event_id);


--
-- Name: venue_bookings_venue_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX venue_bookings_venue_id_index ON public.venue_bookings USING btree (venue_id);


--
-- Name: venues_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX venues_created_at_index ON public.venues USING btree (created_at);


--
-- Name: venues_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX venues_creator_id_index ON public.venues USING btree (creator_id);


--
-- Name: venues_name_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX venues_name_index ON public.venues USING btree (name);


--
-- Name: venues_name_organization_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE UNIQUE INDEX venues_name_organization_id_index ON public.venues USING btree (name, organization_id);


--
-- Name: venues_organization_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX venues_organization_id_index ON public.venues USING btree (organization_id);


--
-- Name: volunteer_group_assignments_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX volunteer_group_assignments_created_at_index ON public.volunteer_group_assignments USING btree (created_at);


--
-- Name: volunteer_group_assignments_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX volunteer_group_assignments_creator_id_index ON public.volunteer_group_assignments USING btree (creator_id);


--
-- Name: volunteer_group_assignments_group_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX volunteer_group_assignments_group_id_index ON public.volunteer_group_assignments USING btree (group_id);


--
-- Name: volunteer_groups_created_at_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX volunteer_groups_created_at_index ON public.volunteer_groups USING btree (created_at);


--
-- Name: volunteer_groups_creator_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX volunteer_groups_creator_id_index ON public.volunteer_groups USING btree (creator_id);


--
-- Name: volunteer_groups_event_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX volunteer_groups_event_id_index ON public.volunteer_groups USING btree (event_id);


--
-- Name: volunteer_groups_event_id_name_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE UNIQUE INDEX volunteer_groups_event_id_name_index ON public.volunteer_groups USING btree (event_id, name);


--
-- Name: volunteer_groups_leader_id_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX volunteer_groups_leader_id_index ON public.volunteer_groups USING btree (leader_id);


--
-- Name: volunteer_groups_name_index; Type: INDEX; Schema: public; Owner: talawa
--

CREATE INDEX volunteer_groups_name_index ON public.volunteer_groups USING btree (name);


--
-- Name: action_categories action_categories_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.action_categories
    ADD CONSTRAINT action_categories_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: action_categories action_categories_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.action_categories
    ADD CONSTRAINT action_categories_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: action_categories action_categories_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.action_categories
    ADD CONSTRAINT action_categories_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: actions actions_actor_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_actor_id_users_id_fk FOREIGN KEY (actor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: actions actions_category_id_action_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_category_id_action_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.action_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: actions actions_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: actions actions_event_id_events_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_event_id_events_id_fk FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: actions actions_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: actions actions_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: advertisement_attachments advertisement_attachments_advertisement_id_advertisements_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.advertisement_attachments
    ADD CONSTRAINT advertisement_attachments_advertisement_id_advertisements_id_fk FOREIGN KEY (advertisement_id) REFERENCES public.advertisements(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: advertisement_attachments advertisement_attachments_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.advertisement_attachments
    ADD CONSTRAINT advertisement_attachments_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: advertisement_attachments advertisement_attachments_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.advertisement_attachments
    ADD CONSTRAINT advertisement_attachments_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: advertisements advertisements_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.advertisements
    ADD CONSTRAINT advertisements_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: advertisements advertisements_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.advertisements
    ADD CONSTRAINT advertisements_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: advertisements advertisements_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.advertisements
    ADD CONSTRAINT advertisements_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: agenda_folders agenda_folders_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.agenda_folders
    ADD CONSTRAINT agenda_folders_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: agenda_folders agenda_folders_event_id_events_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.agenda_folders
    ADD CONSTRAINT agenda_folders_event_id_events_id_fk FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agenda_folders agenda_folders_parent_folder_id_agenda_folders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.agenda_folders
    ADD CONSTRAINT agenda_folders_parent_folder_id_agenda_folders_id_fk FOREIGN KEY (parent_folder_id) REFERENCES public.agenda_folders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agenda_folders agenda_folders_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.agenda_folders
    ADD CONSTRAINT agenda_folders_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: agenda_items agenda_items_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.agenda_items
    ADD CONSTRAINT agenda_items_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: agenda_items agenda_items_folder_id_agenda_folders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.agenda_items
    ADD CONSTRAINT agenda_items_folder_id_agenda_folders_id_fk FOREIGN KEY (folder_id) REFERENCES public.agenda_folders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agenda_items agenda_items_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.agenda_items
    ADD CONSTRAINT agenda_items_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: chat_memberships chat_memberships_chat_id_chats_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.chat_memberships
    ADD CONSTRAINT chat_memberships_chat_id_chats_id_fk FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_memberships chat_memberships_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.chat_memberships
    ADD CONSTRAINT chat_memberships_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: chat_memberships chat_memberships_member_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.chat_memberships
    ADD CONSTRAINT chat_memberships_member_id_users_id_fk FOREIGN KEY (member_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_memberships chat_memberships_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.chat_memberships
    ADD CONSTRAINT chat_memberships_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: chat_messages chat_messages_chat_id_chats_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_chat_id_chats_id_fk FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: chat_messages chat_messages_parent_message_id_chat_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_parent_message_id_chat_messages_id_fk FOREIGN KEY (parent_message_id) REFERENCES public.chat_messages(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: chats chats_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: chats chats_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chats chats_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: comment_votes comment_votes_comment_id_comments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.comment_votes
    ADD CONSTRAINT comment_votes_comment_id_comments_id_fk FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comment_votes comment_votes_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.comment_votes
    ADD CONSTRAINT comment_votes_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: comments comments_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: comments comments_post_id_posts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_post_id_posts_id_fk FOREIGN KEY (post_id) REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: communities communities_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: event_attachments event_attachments_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.event_attachments
    ADD CONSTRAINT event_attachments_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: event_attachments event_attachments_event_id_events_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.event_attachments
    ADD CONSTRAINT event_attachments_event_id_events_id_fk FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_attachments event_attachments_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.event_attachments
    ADD CONSTRAINT event_attachments_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: event_attendances event_attendances_attendee_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.event_attendances
    ADD CONSTRAINT event_attendances_attendee_id_users_id_fk FOREIGN KEY (attendee_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_attendances event_attendances_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.event_attendances
    ADD CONSTRAINT event_attendances_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: event_attendances event_attendances_event_id_events_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.event_attendances
    ADD CONSTRAINT event_attendances_event_id_events_id_fk FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_attendances event_attendances_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.event_attendances
    ADD CONSTRAINT event_attendances_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: events events_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: events events_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: events events_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: families families_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.families
    ADD CONSTRAINT families_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: families families_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.families
    ADD CONSTRAINT families_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: families families_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.families
    ADD CONSTRAINT families_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: family_memberships family_memberships_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.family_memberships
    ADD CONSTRAINT family_memberships_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: family_memberships family_memberships_family_id_families_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.family_memberships
    ADD CONSTRAINT family_memberships_family_id_families_id_fk FOREIGN KEY (family_id) REFERENCES public.families(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: family_memberships family_memberships_member_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.family_memberships
    ADD CONSTRAINT family_memberships_member_id_users_id_fk FOREIGN KEY (member_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: family_memberships family_memberships_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.family_memberships
    ADD CONSTRAINT family_memberships_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: fund_campaign_pledges fund_campaign_pledges_campaign_id_fund_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.fund_campaign_pledges
    ADD CONSTRAINT fund_campaign_pledges_campaign_id_fund_campaigns_id_fk FOREIGN KEY (campaign_id) REFERENCES public.fund_campaigns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fund_campaign_pledges fund_campaign_pledges_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.fund_campaign_pledges
    ADD CONSTRAINT fund_campaign_pledges_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: fund_campaign_pledges fund_campaign_pledges_pledger_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.fund_campaign_pledges
    ADD CONSTRAINT fund_campaign_pledges_pledger_id_users_id_fk FOREIGN KEY (pledger_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fund_campaign_pledges fund_campaign_pledges_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.fund_campaign_pledges
    ADD CONSTRAINT fund_campaign_pledges_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: fund_campaigns fund_campaigns_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.fund_campaigns
    ADD CONSTRAINT fund_campaigns_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: fund_campaigns fund_campaigns_fund_id_funds_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.fund_campaigns
    ADD CONSTRAINT fund_campaigns_fund_id_funds_id_fk FOREIGN KEY (fund_id) REFERENCES public.funds(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fund_campaigns fund_campaigns_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.fund_campaigns
    ADD CONSTRAINT fund_campaigns_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: funds funds_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.funds
    ADD CONSTRAINT funds_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: funds funds_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.funds
    ADD CONSTRAINT funds_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: funds funds_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.funds
    ADD CONSTRAINT funds_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: organization_memberships organization_memberships_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: organization_memberships organization_memberships_member_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_member_id_users_id_fk FOREIGN KEY (member_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_memberships organization_memberships_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_memberships organization_memberships_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: organizations organizations_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: organizations organizations_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: post_attachments post_attachments_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.post_attachments
    ADD CONSTRAINT post_attachments_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: post_attachments post_attachments_post_id_posts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.post_attachments
    ADD CONSTRAINT post_attachments_post_id_posts_id_fk FOREIGN KEY (post_id) REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_attachments post_attachments_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.post_attachments
    ADD CONSTRAINT post_attachments_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: post_votes post_votes_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.post_votes
    ADD CONSTRAINT post_votes_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: post_votes post_votes_post_id_posts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.post_votes
    ADD CONSTRAINT post_votes_post_id_posts_id_fk FOREIGN KEY (post_id) REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: posts posts_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: posts posts_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: posts posts_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tag_assignments tag_assignments_assignee_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.tag_assignments
    ADD CONSTRAINT tag_assignments_assignee_id_users_id_fk FOREIGN KEY (assignee_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tag_assignments tag_assignments_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.tag_assignments
    ADD CONSTRAINT tag_assignments_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tag_assignments tag_assignments_tag_id_tags_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.tag_assignments
    ADD CONSTRAINT tag_assignments_tag_id_tags_id_fk FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tag_folders tag_folders_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.tag_folders
    ADD CONSTRAINT tag_folders_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tag_folders tag_folders_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.tag_folders
    ADD CONSTRAINT tag_folders_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tag_folders tag_folders_parent_folder_id_tag_folders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.tag_folders
    ADD CONSTRAINT tag_folders_parent_folder_id_tag_folders_id_fk FOREIGN KEY (parent_folder_id) REFERENCES public.tag_folders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tag_folders tag_folders_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.tag_folders
    ADD CONSTRAINT tag_folders_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tags tags_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tags tags_folder_id_tag_folders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_folder_id_tag_folders_id_fk FOREIGN KEY (folder_id) REFERENCES public.tag_folders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tags tags_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tags tags_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: venue_attachments venue_attachments_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.venue_attachments
    ADD CONSTRAINT venue_attachments_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: venue_attachments venue_attachments_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.venue_attachments
    ADD CONSTRAINT venue_attachments_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: venue_attachments venue_attachments_venue_id_venues_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.venue_attachments
    ADD CONSTRAINT venue_attachments_venue_id_venues_id_fk FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: venue_bookings venue_bookings_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.venue_bookings
    ADD CONSTRAINT venue_bookings_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: venue_bookings venue_bookings_event_id_events_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.venue_bookings
    ADD CONSTRAINT venue_bookings_event_id_events_id_fk FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: venue_bookings venue_bookings_venue_id_venues_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.venue_bookings
    ADD CONSTRAINT venue_bookings_venue_id_venues_id_fk FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: venues venues_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: venues venues_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: venues venues_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: volunteer_group_assignments volunteer_group_assignments_assignee_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.volunteer_group_assignments
    ADD CONSTRAINT volunteer_group_assignments_assignee_id_users_id_fk FOREIGN KEY (assignee_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: volunteer_group_assignments volunteer_group_assignments_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.volunteer_group_assignments
    ADD CONSTRAINT volunteer_group_assignments_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: volunteer_group_assignments volunteer_group_assignments_group_id_volunteer_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.volunteer_group_assignments
    ADD CONSTRAINT volunteer_group_assignments_group_id_volunteer_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.volunteer_groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: volunteer_group_assignments volunteer_group_assignments_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.volunteer_group_assignments
    ADD CONSTRAINT volunteer_group_assignments_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: volunteer_groups volunteer_groups_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.volunteer_groups
    ADD CONSTRAINT volunteer_groups_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: volunteer_groups volunteer_groups_event_id_events_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.volunteer_groups
    ADD CONSTRAINT volunteer_groups_event_id_events_id_fk FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: volunteer_groups volunteer_groups_leader_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.volunteer_groups
    ADD CONSTRAINT volunteer_groups_leader_id_users_id_fk FOREIGN KEY (leader_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: volunteer_groups volunteer_groups_updater_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: talawa
--

ALTER TABLE ONLY public.volunteer_groups
    ADD CONSTRAINT volunteer_groups_updater_id_users_id_fk FOREIGN KEY (updater_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

