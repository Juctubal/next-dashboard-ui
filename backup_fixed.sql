--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4 (Debian 17.4-1.pgdg120+2)
-- Dumped by pg_dump version 17.5

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: nieves
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO nieves;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: nieves
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AgeCategory; Type: TYPE; Schema: public; Owner: nieves
--

CREATE TYPE public."AgeCategory" AS ENUM (
    'STAG',
    'BULLSTAG',
    'COCK',
    'ANY'
);


ALTER TYPE public."AgeCategory" OWNER TO nieves;

--
-- Name: BreedingStatus; Type: TYPE; Schema: public; Owner: nieves
--

CREATE TYPE public."BreedingStatus" AS ENUM (
    'ONGOING',
    'FINISHED'
);


ALTER TYPE public."BreedingStatus" OWNER TO nieves;

--
-- Name: ConditioningStatus; Type: TYPE; Schema: public; Owner: nieves
--

CREATE TYPE public."ConditioningStatus" AS ENUM (
    'ASSIGNED',
    'COMPLETED'
);


ALTER TYPE public."ConditioningStatus" OWNER TO nieves;

--
-- Name: EventStatus; Type: TYPE; Schema: public; Owner: nieves
--

CREATE TYPE public."EventStatus" AS ENUM (
    'ASSIGNED',
    'FINISHED'
);


ALTER TYPE public."EventStatus" OWNER TO nieves;

--
-- Name: EventType; Type: TYPE; Schema: public; Owner: nieves
--

CREATE TYPE public."EventType" AS ENUM (
    'THREE_COCK_DERBY',
    'FOUR_COCK_DERBY',
    'FIVE_COCK_DERBY',
    'SOLO',
    'OTHER',
    'TWO_COCK_DERBY'
);


ALTER TYPE public."EventType" OWNER TO nieves;

--
-- Name: GamefowlSex; Type: TYPE; Schema: public; Owner: nieves
--

CREATE TYPE public."GamefowlSex" AS ENUM (
    'MALE',
    'FEMALE'
);


ALTER TYPE public."GamefowlSex" OWNER TO nieves;

--
-- Name: GamefowlStatus; Type: TYPE; Schema: public; Owner: nieves
--

CREATE TYPE public."GamefowlStatus" AS ENUM (
    'IDLE',
    'COMPETING',
    'BREEDING',
    'CONDITIONING',
    'INJURED',
    'DECEASED',
    'SOLD'
);


ALTER TYPE public."GamefowlStatus" OWNER TO nieves;

--
-- Name: IncubationStatus; Type: TYPE; Schema: public; Owner: nieves
--

CREATE TYPE public."IncubationStatus" AS ENUM (
    'ONGOING',
    'FINISHED'
);


ALTER TYPE public."IncubationStatus" OWNER TO nieves;

--
-- Name: RecurrencePattern; Type: TYPE; Schema: public; Owner: nieves
--

CREATE TYPE public."RecurrencePattern" AS ENUM (
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'YEARLY',
    'CUSTOM'
);


ALTER TYPE public."RecurrencePattern" OWNER TO nieves;

--
-- Name: Result; Type: TYPE; Schema: public; Owner: nieves
--

CREATE TYPE public."Result" AS ENUM (
    'WIN',
    'LOSS',
    'DRAW',
    'NO_SHOW'
);


ALTER TYPE public."Result" OWNER TO nieves;

--
-- Name: TaskCategory; Type: TYPE; Schema: public; Owner: nieves
--

CREATE TYPE public."TaskCategory" AS ENUM (
    'FEEDING',
    'VACCINATION',
    'DEWORMING',
    'OTHER'
);


ALTER TYPE public."TaskCategory" OWNER TO nieves;

--
-- Name: TaskType; Type: TYPE; Schema: public; Owner: nieves
--

CREATE TYPE public."TaskType" AS ENUM (
    'RECURRING',
    'ONETIME'
);


ALTER TYPE public."TaskType" OWNER TO nieves;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: nieves
--

CREATE TYPE public."UserRole" AS ENUM (
    'admin',
    'owner',
    'breeder',
    'handler'
);


ALTER TYPE public."UserRole" OWNER TO nieves;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: nieves
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'RESIGNED'
);


ALTER TYPE public."UserStatus" OWNER TO nieves;

--
-- Name: gamefowlAge; Type: TYPE; Schema: public; Owner: nieves
--

CREATE TYPE public."gamefowlAge" AS ENUM (
    'CHICK',
    'STAG',
    'BULLSTAG',
    'COCK',
    'PULLET',
    'HEN'
);


ALTER TYPE public."gamefowlAge" OWNER TO nieves;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Admin; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."Admin" (
    id text NOT NULL,
    username text NOT NULL
);


ALTER TABLE public."Admin" OWNER TO nieves;

--
-- Name: Batch; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."Batch" (
    id integer NOT NULL,
    "hatchRate" double precision NOT NULL,
    "dateHatched" timestamp(3) without time zone NOT NULL,
    incubate_id integer NOT NULL
);


ALTER TABLE public."Batch" OWNER TO nieves;

--
-- Name: Batch_id_seq; Type: SEQUENCE; Schema: public; Owner: nieves
--

CREATE SEQUENCE public."Batch_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Batch_id_seq" OWNER TO nieves;

--
-- Name: Batch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nieves
--

ALTER SEQUENCE public."Batch_id_seq" OWNED BY public."Batch".id;


--
-- Name: Breeder; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."Breeder" (
    id text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    img text,
    phone text,
    role public."UserRole" DEFAULT 'breeder'::public."UserRole" NOT NULL,
    status public."UserStatus" DEFAULT 'ACTIVE'::public."UserStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    middle_name text,
    "isArchived" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Breeder" OWNER TO nieves;

--
-- Name: Breeding; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."Breeding" (
    id integer NOT NULL,
    "sireId" integer NOT NULL,
    "damId" integer NOT NULL,
    notes text NOT NULL,
    status public."BreedingStatus" NOT NULL,
    "endDate" timestamp(3) without time zone,
    "startDate" timestamp(3) without time zone,
    "isArchived" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Breeding" OWNER TO nieves;

--
-- Name: Breeding_id_seq; Type: SEQUENCE; Schema: public; Owner: nieves
--

CREATE SEQUENCE public."Breeding_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Breeding_id_seq" OWNER TO nieves;

--
-- Name: Breeding_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nieves
--

ALTER SEQUENCE public."Breeding_id_seq" OWNED BY public."Breeding".id;


--
-- Name: Conditioning; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."Conditioning" (
    id integer NOT NULL,
    "eventId" integer,
    "conProgId" integer NOT NULL,
    "handlerId" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    status public."ConditioningStatus" NOT NULL,
    notes text
);


ALTER TABLE public."Conditioning" OWNER TO nieves;

--
-- Name: ConditioningActivity; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."ConditioningActivity" (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    "programId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ConditioningActivity" OWNER TO nieves;

--
-- Name: ConditioningActivitySchedule; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."ConditioningActivitySchedule" (
    id integer NOT NULL,
    "conditioningId" integer NOT NULL,
    "activityId" integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    status text DEFAULT 'PLANNED'::text NOT NULL,
    "timeOfDay" text DEFAULT 'MORNING'::text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ConditioningActivitySchedule" OWNER TO nieves;

--
-- Name: ConditioningActivitySchedule_id_seq; Type: SEQUENCE; Schema: public; Owner: nieves
--

CREATE SEQUENCE public."ConditioningActivitySchedule_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ConditioningActivitySchedule_id_seq" OWNER TO nieves;

--
-- Name: ConditioningActivitySchedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nieves
--

ALTER SEQUENCE public."ConditioningActivitySchedule_id_seq" OWNED BY public."ConditioningActivitySchedule".id;


--
-- Name: ConditioningActivity_id_seq; Type: SEQUENCE; Schema: public; Owner: nieves
--

CREATE SEQUENCE public."ConditioningActivity_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ConditioningActivity_id_seq" OWNER TO nieves;

--
-- Name: ConditioningActivity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nieves
--

ALTER SEQUENCE public."ConditioningActivity_id_seq" OWNED BY public."ConditioningActivity".id;


--
-- Name: ConditioningGamefowl; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."ConditioningGamefowl" (
    id integer NOT NULL,
    "conditioningId" integer NOT NULL,
    "gamefowlId" integer NOT NULL
);


ALTER TABLE public."ConditioningGamefowl" OWNER TO nieves;

--
-- Name: ConditioningGamefowl_id_seq; Type: SEQUENCE; Schema: public; Owner: nieves
--

CREATE SEQUENCE public."ConditioningGamefowl_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ConditioningGamefowl_id_seq" OWNER TO nieves;

--
-- Name: ConditioningGamefowl_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nieves
--

ALTER SEQUENCE public."ConditioningGamefowl_id_seq" OWNED BY public."ConditioningGamefowl".id;


--
-- Name: ConditioningProgram; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."ConditioningProgram" (
    id integer NOT NULL,
    "programName" text NOT NULL,
    description text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ConditioningProgram" OWNER TO nieves;

--
-- Name: ConditioningProgram_id_seq; Type: SEQUENCE; Schema: public; Owner: nieves
--

CREATE SEQUENCE public."ConditioningProgram_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ConditioningProgram_id_seq" OWNER TO nieves;

--
-- Name: ConditioningProgram_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nieves
--

ALTER SEQUENCE public."ConditioningProgram_id_seq" OWNED BY public."ConditioningProgram".id;


--
-- Name: Conditioning_id_seq; Type: SEQUENCE; Schema: public; Owner: nieves
--

CREATE SEQUENCE public."Conditioning_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Conditioning_id_seq" OWNER TO nieves;

--
-- Name: Conditioning_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nieves
--

ALTER SEQUENCE public."Conditioning_id_seq" OWNED BY public."Conditioning".id;


--
-- Name: Deworming; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."Deworming" (
    id integer NOT NULL,
    "gamefowlId" integer NOT NULL,
    "dewormDate" timestamp(3) without time zone NOT NULL,
    notes text NOT NULL,
    name text,
    "isArchived" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Deworming" OWNER TO nieves;

--
-- Name: Deworming_id_seq; Type: SEQUENCE; Schema: public; Owner: nieves
--

CREATE SEQUENCE public."Deworming_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Deworming_id_seq" OWNER TO nieves;

--
-- Name: Deworming_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nieves
--

ALTER SEQUENCE public."Deworming_id_seq" OWNED BY public."Deworming".id;


--
-- Name: Event; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."Event" (
    id integer NOT NULL,
    "eventName" text NOT NULL,
    "eventType" public."EventType" NOT NULL,
    "ageCategory" public."AgeCategory" NOT NULL,
    "eventDate" timestamp(3) without time zone NOT NULL,
    description text NOT NULL,
    status public."EventStatus" NOT NULL,
    "handlerId" text
);


ALTER TABLE public."Event" OWNER TO nieves;

--
-- Name: EventGamefowl; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."EventGamefowl" (
    id integer NOT NULL,
    "eventId" integer NOT NULL,
    "gamefowlId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."EventGamefowl" OWNER TO nieves;

--
-- Name: EventGamefowl_id_seq; Type: SEQUENCE; Schema: public; Owner: nieves
--

CREATE SEQUENCE public."EventGamefowl_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."EventGamefowl_id_seq" OWNER TO nieves;

--
-- Name: EventGamefowl_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nieves
--

ALTER SEQUENCE public."EventGamefowl_id_seq" OWNED BY public."EventGamefowl".id;


--
-- Name: EventResult; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."EventResult" (
    id integer NOT NULL,
    "eventId" integer NOT NULL,
    "gamefowlId" integer NOT NULL,
    result public."Result" NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EventResult" OWNER TO nieves;

--
-- Name: EventResult_id_seq; Type: SEQUENCE; Schema: public; Owner: nieves
--

CREATE SEQUENCE public."EventResult_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."EventResult_id_seq" OWNER TO nieves;

--
-- Name: EventResult_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nieves
--

ALTER SEQUENCE public."EventResult_id_seq" OWNED BY public."EventResult".id;


--
-- Name: Event_id_seq; Type: SEQUENCE; Schema: public; Owner: nieves
--

CREATE SEQUENCE public."Event_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Event_id_seq" OWNER TO nieves;

--
-- Name: Event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nieves
--

ALTER SEQUENCE public."Event_id_seq" OWNED BY public."Event".id;


--
-- Name: Gamefowl; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."Gamefowl" (
    id integer NOT NULL,
    name text NOT NULL,
    bloodline text NOT NULL,
    date_hatched timestamp(3) without time zone,
    date_sold timestamp(3) without time zone,
    "sireId" integer,
    "damId" integer,
    "batchId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    img text,
    age public."gamefowlAge",
    "isArchived" boolean DEFAULT false NOT NULL,
    "eloRating" integer DEFAULT 1000 NOT NULL,
    sex public."GamefowlSex" NOT NULL,
    status public."GamefowlStatus" DEFAULT 'IDLE'::public."GamefowlStatus" NOT NULL
);


ALTER TABLE public."Gamefowl" OWNER TO nieves;

--
-- Name: Gamefowl_id_seq; Type: SEQUENCE; Schema: public; Owner: nieves
--

CREATE SEQUENCE public."Gamefowl_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Gamefowl_id_seq" OWNER TO nieves;

--
-- Name: Gamefowl_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nieves
--

ALTER SEQUENCE public."Gamefowl_id_seq" OWNED BY public."Gamefowl".id;


--
-- Name: Handler; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."Handler" (
    id text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    first_name text NOT NULL,
    middle_name text,
    last_name text NOT NULL,
    email text,
    img text,
    phone text,
    role public."UserRole" NOT NULL,
    status public."UserStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Handler" OWNER TO nieves;

--
-- Name: Incubation; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."Incubation" (
    id integer NOT NULL,
    "incStart" timestamp(3) without time zone NOT NULL,
    "incEnd" timestamp(3) without time zone NOT NULL,
    status public."IncubationStatus" NOT NULL,
    "eggCount" integer NOT NULL,
    "breedingId" integer,
    "isArchived" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Incubation" OWNER TO nieves;

--
-- Name: Incubation_id_seq; Type: SEQUENCE; Schema: public; Owner: nieves
--

CREATE SEQUENCE public."Incubation_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Incubation_id_seq" OWNER TO nieves;

--
-- Name: Incubation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nieves
--

ALTER SEQUENCE public."Incubation_id_seq" OWNED BY public."Incubation".id;


--
-- Name: OneTimeSched; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."OneTimeSched" (
    id integer NOT NULL,
    "schedId" integer NOT NULL,
    "taskName" text NOT NULL,
    "taskDate" timestamp(3) without time zone NOT NULL,
    time_of_day text NOT NULL
);


ALTER TABLE public."OneTimeSched" OWNER TO nieves;

--
-- Name: OneTimeSched_id_seq; Type: SEQUENCE; Schema: public; Owner: nieves
--

CREATE SEQUENCE public."OneTimeSched_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."OneTimeSched_id_seq" OWNER TO nieves;

--
-- Name: OneTimeSched_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nieves
--

ALTER SEQUENCE public."OneTimeSched_id_seq" OWNED BY public."OneTimeSched".id;


--
-- Name: RecurrentSchedules; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."RecurrentSchedules" (
    id integer NOT NULL,
    "schedId" integer NOT NULL,
    "reccurencePattern" public."RecurrencePattern" NOT NULL,
    time_of_day text NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "customInterval" integer,
    "weekDays" text,
    "customDate" text,
    "repeatIndefinitely" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."RecurrentSchedules" OWNER TO nieves;

--
-- Name: RecurrentSchedules_id_seq; Type: SEQUENCE; Schema: public; Owner: nieves
--

CREATE SEQUENCE public."RecurrentSchedules_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RecurrentSchedules_id_seq" OWNER TO nieves;

--
-- Name: RecurrentSchedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nieves
--

ALTER SEQUENCE public."RecurrentSchedules_id_seq" OWNED BY public."RecurrentSchedules".id;


--
-- Name: RecurringTaskCompletion; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."RecurringTaskCompletion" (
    id integer NOT NULL,
    "recurrentId" integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RecurringTaskCompletion" OWNER TO nieves;

--
-- Name: RecurringTaskCompletion_id_seq; Type: SEQUENCE; Schema: public; Owner: nieves
--

CREATE SEQUENCE public."RecurringTaskCompletion_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RecurringTaskCompletion_id_seq" OWNER TO nieves;

--
-- Name: RecurringTaskCompletion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nieves
--

ALTER SEQUENCE public."RecurringTaskCompletion_id_seq" OWNED BY public."RecurringTaskCompletion".id;


--
-- Name: Schedule; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."Schedule" (
    id integer NOT NULL,
    "taskName" text NOT NULL,
    "taskType" public."TaskType" NOT NULL,
    "taskCategory" public."TaskCategory" NOT NULL,
    descript text NOT NULL,
    "staffId" text,
    "staffType" public."UserRole",
    status public."EventStatus" DEFAULT 'ASSIGNED'::public."EventStatus" NOT NULL
);


ALTER TABLE public."Schedule" OWNER TO nieves;

--
-- Name: Schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: nieves
--

CREATE SEQUENCE public."Schedule_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Schedule_id_seq" OWNER TO nieves;

--
-- Name: Schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nieves
--

ALTER SEQUENCE public."Schedule_id_seq" OWNED BY public."Schedule".id;


--
-- Name: Sparring; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."Sparring" (
    id integer NOT NULL,
    "gamefowl_1_Id" integer NOT NULL,
    "gamefowl_2_Id" integer NOT NULL,
    "winnerId" integer NOT NULL,
    "loserId" integer NOT NULL,
    winner_elo_change integer NOT NULL,
    loser_elo_change integer NOT NULL,
    "sparringDate" timestamp(3) without time zone NOT NULL,
    notes text NOT NULL
);


ALTER TABLE public."Sparring" OWNER TO nieves;

--
-- Name: Sparring_id_seq; Type: SEQUENCE; Schema: public; Owner: nieves
--

CREATE SEQUENCE public."Sparring_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Sparring_id_seq" OWNER TO nieves;

--
-- Name: Sparring_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nieves
--

ALTER SEQUENCE public."Sparring_id_seq" OWNED BY public."Sparring".id;


--
-- Name: Vaccine; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public."Vaccine" (
    id integer NOT NULL,
    "gamefowlId" integer NOT NULL,
    "vaccinationDate" timestamp(3) without time zone NOT NULL,
    notes text NOT NULL,
    name text,
    "isArchived" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Vaccine" OWNER TO nieves;

--
-- Name: Vaccine_id_seq; Type: SEQUENCE; Schema: public; Owner: nieves
--

CREATE SEQUENCE public."Vaccine_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Vaccine_id_seq" OWNER TO nieves;

--
-- Name: Vaccine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nieves
--

ALTER SEQUENCE public."Vaccine_id_seq" OWNED BY public."Vaccine".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: nieves
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO nieves;

--
-- Name: Batch id; Type: DEFAULT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Batch" ALTER COLUMN id SET DEFAULT nextval('public."Batch_id_seq"'::regclass);


--
-- Name: Breeding id; Type: DEFAULT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Breeding" ALTER COLUMN id SET DEFAULT nextval('public."Breeding_id_seq"'::regclass);


--
-- Name: Conditioning id; Type: DEFAULT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Conditioning" ALTER COLUMN id SET DEFAULT nextval('public."Conditioning_id_seq"'::regclass);


--
-- Name: ConditioningActivity id; Type: DEFAULT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."ConditioningActivity" ALTER COLUMN id SET DEFAULT nextval('public."ConditioningActivity_id_seq"'::regclass);


--
-- Name: ConditioningActivitySchedule id; Type: DEFAULT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."ConditioningActivitySchedule" ALTER COLUMN id SET DEFAULT nextval('public."ConditioningActivitySchedule_id_seq"'::regclass);


--
-- Name: ConditioningGamefowl id; Type: DEFAULT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."ConditioningGamefowl" ALTER COLUMN id SET DEFAULT nextval('public."ConditioningGamefowl_id_seq"'::regclass);


--
-- Name: ConditioningProgram id; Type: DEFAULT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."ConditioningProgram" ALTER COLUMN id SET DEFAULT nextval('public."ConditioningProgram_id_seq"'::regclass);


--
-- Name: Deworming id; Type: DEFAULT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Deworming" ALTER COLUMN id SET DEFAULT nextval('public."Deworming_id_seq"'::regclass);


--
-- Name: Event id; Type: DEFAULT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Event" ALTER COLUMN id SET DEFAULT nextval('public."Event_id_seq"'::regclass);


--
-- Name: EventGamefowl id; Type: DEFAULT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."EventGamefowl" ALTER COLUMN id SET DEFAULT nextval('public."EventGamefowl_id_seq"'::regclass);


--
-- Name: EventResult id; Type: DEFAULT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."EventResult" ALTER COLUMN id SET DEFAULT nextval('public."EventResult_id_seq"'::regclass);


--
-- Name: Gamefowl id; Type: DEFAULT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Gamefowl" ALTER COLUMN id SET DEFAULT nextval('public."Gamefowl_id_seq"'::regclass);


--
-- Name: Incubation id; Type: DEFAULT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Incubation" ALTER COLUMN id SET DEFAULT nextval('public."Incubation_id_seq"'::regclass);


--
-- Name: OneTimeSched id; Type: DEFAULT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."OneTimeSched" ALTER COLUMN id SET DEFAULT nextval('public."OneTimeSched_id_seq"'::regclass);


--
-- Name: RecurrentSchedules id; Type: DEFAULT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."RecurrentSchedules" ALTER COLUMN id SET DEFAULT nextval('public."RecurrentSchedules_id_seq"'::regclass);


--
-- Name: RecurringTaskCompletion id; Type: DEFAULT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."RecurringTaskCompletion" ALTER COLUMN id SET DEFAULT nextval('public."RecurringTaskCompletion_id_seq"'::regclass);


--
-- Name: Schedule id; Type: DEFAULT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Schedule" ALTER COLUMN id SET DEFAULT nextval('public."Schedule_id_seq"'::regclass);


--
-- Name: Sparring id; Type: DEFAULT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Sparring" ALTER COLUMN id SET DEFAULT nextval('public."Sparring_id_seq"'::regclass);


--
-- Name: Vaccine id; Type: DEFAULT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Vaccine" ALTER COLUMN id SET DEFAULT nextval('public."Vaccine_id_seq"'::regclass);


--
-- Data for Name: Admin; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."Admin" (id, username) FROM stdin;
\.


--
-- Data for Name: Batch; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."Batch" (id, "hatchRate", "dateHatched", incubate_id) FROM stdin;
\.


--
-- Data for Name: Breeder; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."Breeder" (id, username, password, first_name, last_name, email, img, phone, role, status, "createdAt", middle_name, "isArchived") FROM stdin;
\.


--
-- Data for Name: Breeding; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."Breeding" (id, "sireId", "damId", notes, status, "endDate", "startDate", "isArchived") FROM stdin;
\.


--
-- Data for Name: Conditioning; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."Conditioning" (id, "eventId", "conProgId", "handlerId", "startDate", "endDate", status, notes) FROM stdin;
\.


--
-- Data for Name: ConditioningActivity; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."ConditioningActivity" (id, name, description, "programId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ConditioningActivitySchedule; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."ConditioningActivitySchedule" (id, "conditioningId", "activityId", date, "createdAt", notes, status, "timeOfDay", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ConditioningGamefowl; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."ConditioningGamefowl" (id, "conditioningId", "gamefowlId") FROM stdin;
\.


--
-- Data for Name: ConditioningProgram; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."ConditioningProgram" (id, "programName", description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Deworming; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."Deworming" (id, "gamefowlId", "dewormDate", notes, name, "isArchived") FROM stdin;
\.


--
-- Data for Name: Event; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."Event" (id, "eventName", "eventType", "ageCategory", "eventDate", description, status, "handlerId") FROM stdin;
\.


--
-- Data for Name: EventGamefowl; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."EventGamefowl" (id, "eventId", "gamefowlId", "createdAt") FROM stdin;
\.


--
-- Data for Name: EventResult; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."EventResult" (id, "eventId", "gamefowlId", result, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Gamefowl; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."Gamefowl" (id, name, bloodline, date_hatched, date_sold, "sireId", "damId", "batchId", "createdAt", img, age, "isArchived", "eloRating", sex, status) FROM stdin;
1	Hatch Grey Male #1	Hatch Grey	2024-07-20 00:00:00	\N	\N	\N	\N	2025-05-22 11:14:53.358	\N	STAG	f	1000	MALE	IDLE
2	Hatch Grey M #2	Hatch Grey	2020-07-20 00:00:00	\N	\N	\N	\N	2025-05-22 11:15:10.764	\N	COCK	f	1000	MALE	IDLE
3	Hatch Grey Female #1	Hatch Grey	2024-07-20 00:00:00	\N	\N	\N	\N	2025-05-22 11:15:29.069	\N	PULLET	f	1000	FEMALE	IDLE
4	Hatch Grey Female #2	Hatch Grey	2024-07-20 00:00:00	\N	\N	\N	\N	2025-05-22 11:15:44.187	\N	PULLET	f	1000	FEMALE	IDLE
5	White Kelso Male #1	White Kelso	2023-01-01 00:00:00	\N	\N	\N	\N	2025-05-22 11:15:59.686	\N	COCK	f	1000	MALE	IDLE
6	White Kelso Male #2	White Kelso	2023-01-01 00:00:00	\N	\N	\N	\N	2025-05-22 11:16:13.161	\N	COCK	f	1000	MALE	IDLE
7	Jumper Sweater Male #1	Jumper Sweater	2023-01-01 00:00:00	\N	\N	\N	\N	2025-05-22 11:17:13.313	\N	COCK	f	1000	MALE	IDLE
8	Jumper Sweater Male #2	Jumper Sweater	2023-01-01 00:00:00	\N	\N	\N	\N	2025-05-22 11:17:26.72	\N	COCK	f	1000	MALE	IDLE
9	Golden Monkey Male #1	Golden Monkey	2023-01-01 00:00:00	\N	\N	\N	\N	2025-05-22 11:17:42.788	\N	COCK	f	1000	MALE	IDLE
10	Golden Monkey Male #2	Golden Monkey	2023-01-01 00:00:00	\N	\N	\N	\N	2025-05-22 11:17:56.959	\N	COCK	f	1000	MALE	IDLE
\.


--
-- Data for Name: Handler; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."Handler" (id, username, password, first_name, middle_name, last_name, email, img, phone, role, status, "createdAt", "isArchived") FROM stdin;
user_2xRsuL3Vkutsu6F9QRcoPLSyCjM	jontubs	Castrotubal4103	Jon	\N	Tubal	\N	\N	\N	handler	ACTIVE	2025-05-22 11:14:01.903	f
\.


--
-- Data for Name: Incubation; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."Incubation" (id, "incStart", "incEnd", status, "eggCount", "breedingId", "isArchived") FROM stdin;
\.


--
-- Data for Name: OneTimeSched; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."OneTimeSched" (id, "schedId", "taskName", "taskDate", time_of_day) FROM stdin;
\.


--
-- Data for Name: RecurrentSchedules; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."RecurrentSchedules" (id, "schedId", "reccurencePattern", time_of_day, "endDate", "startDate", "customInterval", "weekDays", "customDate", "repeatIndefinitely") FROM stdin;
2	2	DAILY	07:00	2025-05-30 00:00:00	2025-05-01 00:00:00	\N	[]	\N	f
\.


--
-- Data for Name: RecurringTaskCompletion; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."RecurringTaskCompletion" (id, "recurrentId", date, completed, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Schedule; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."Schedule" (id, "taskName", "taskType", "taskCategory", descript, "staffId", "staffType", status) FROM stdin;
2	Feeding	RECURRING	FEEDING	Lorem ipsum	user_2xRsuL3Vkutsu6F9QRcoPLSyCjM	handler	ASSIGNED
\.


--
-- Data for Name: Sparring; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."Sparring" (id, "gamefowl_1_Id", "gamefowl_2_Id", "winnerId", "loserId", winner_elo_change, loser_elo_change, "sparringDate", notes) FROM stdin;
\.


--
-- Data for Name: Vaccine; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public."Vaccine" (id, "gamefowlId", "vaccinationDate", notes, name, "isArchived") FROM stdin;
1	1	2025-04-20 00:00:00	test	Poxine	f
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: nieves
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
e0e8512c-0abf-43da-904c-d524cd1aaea0	d6264cb913cd19b3b0b56c80b05633319d958d5dd2f012dfa54b7e5622cb003d	2025-05-22 11:12:17.650153+00	20250418151531_add_other_to_task_category	\N	\N	2025-05-22 11:12:17.644301+00	1
0c97ebc1-58c5-42a9-b145-539ff67d43b2	671fccaa8c3f5d97f3c4160f72f0f37e29fa40f3c8f78c7f20e4b2cdb0184341	2025-05-22 11:12:17.385431+00	20250403154750_init	\N	\N	2025-05-22 11:12:17.360908+00	1
83d00d11-fc39-4b2c-9760-2e2559409bc5	7a8ef364fc7df92656a458798e8f2566fae2160b3a9c88ea8ec6a334a4faf2d4	2025-05-22 11:12:17.501904+00	20250413124927_sex_required	\N	\N	2025-05-22 11:12:17.495987+00	1
68c81618-5981-41e1-ab09-dfdbbe86d846	a99adba8f1dd906191608159bc5813f4cb35b211caf373c23511b6ce47161e90	2025-05-22 11:12:17.393967+00	20250406024759_add_img_field	\N	\N	2025-05-22 11:12:17.387486+00	1
aea16a78-4d6e-44a3-97e1-93376f08c9a8	298a94e06f2b957af6e738e049560ea88a5cb9a1875549eecf8da6d072b8f19c	2025-05-22 11:12:17.401966+00	20250406142417_add_elo_rating_to_elo	\N	\N	2025-05-22 11:12:17.396052+00	1
a8a9cd82-1f9b-4999-b0b7-89fbe85fb5b0	122d743a0403e77ad7e0ed9447f5b8826f2fbdbc55612d936eff004dd13c2eec	2025-05-22 11:12:17.574485+00	20250417030435_rename_activity_to_conditioning_activity	\N	\N	2025-05-22 11:12:17.568816+00	1
a2711be1-5395-4c3e-8ed8-01f43d61043c	3599ad57ea0b2abbdf974411daa825f893f045fe98a946883d4480160dd84c23	2025-05-22 11:12:17.410993+00	20250410124647_add_breeder_model	\N	\N	2025-05-22 11:12:17.404097+00	1
e68bddee-bb4e-424b-9e91-b69402dc4f2d	2e1c0992648d61215e1e6363f4c9000ee3d13e4d085ecd1246fb7059124bfd54	2025-05-22 11:12:17.509922+00	20250413125017_sex_required	\N	\N	2025-05-22 11:12:17.503936+00	1
9beb7d10-a001-46a1-8061-6a14d425e32d	01b2689adaf1e3c43160f1d37b5fde1adcb125be076454ab00fd4fd18a62a202	2025-05-22 11:12:17.419456+00	20250410124710_add_breeder_model	\N	\N	2025-05-22 11:12:17.413008+00	1
a4c6e925-b170-4ace-b82f-65ac95ca6153	8dc2d984af943deab099ce4b891618b772fbe7df52511746d049a48b91c88d91	2025-05-22 11:12:17.427396+00	20250412050147_gamefowlage	\N	\N	2025-05-22 11:12:17.421515+00	1
a86bce02-9247-40f8-967f-1b697e1e3113	04ac664fd86bed833063a78f375b014bd57a1d18bf1f8f17661ea6061d0e5632	2025-05-22 11:12:17.435876+00	20250412063137_add_staff_archive	\N	\N	2025-05-22 11:12:17.429546+00	1
df4b796d-0b48-43ca-b139-dd2e007fc80a	b6914630e6433a63a5d9e3097ee962268c0849eab70bf2a5ebd1e2fcdea77b4c	2025-05-22 11:12:17.517897+00	20250413150347_add_female_age_classifications	\N	\N	2025-05-22 11:12:17.511884+00	1
9201d6ab-9796-4efc-8374-2fe731e5c9c9	c5112b95393d8add22888662859968ddb184501b160d56f4a71fc2bee9c5e1b0	2025-05-22 11:12:17.443938+00	20250412095413_added_name_medicine	\N	\N	2025-05-22 11:12:17.437942+00	1
2b4ce563-24b1-4b29-ab53-66a5a5278653	4637b5f9a4130c9dc2ef1f6b01fe3aad45099049d20a2522822d564c25fe4cf3	2025-05-22 11:12:17.452254+00	20250412100314_add_is_archived_to_gamefowl	\N	\N	2025-05-22 11:12:17.446167+00	1
e63cc921-322a-4547-9b02-3372e4dafd55	479351f0a4c03baa1ae56f3ff7987de16c93e4c92cfd259da40e168ee22c0a4a	2025-05-22 11:12:17.620187+00	20250418075637_add_event_participants	\N	\N	2025-05-22 11:12:17.612889+00	1
a635ce80-ff31-4fda-bf13-cca5682e995b	40145b00d02110f277f24dc8b5ac886059750d508978d0ca3af28b8ac4fe5d28	2025-05-22 11:12:17.461074+00	20250413042003_add_staff_to_schedule	\N	\N	2025-05-22 11:12:17.454385+00	1
2d7fb672-9987-4f64-9df1-c8b138926ed3	c83ff657ec54f0f9c21706241fc1597c69934d1c73f0c32492c24f419e450d7b	2025-05-22 11:12:17.526756+00	20250413152346_add_breeding_dates	\N	\N	2025-05-22 11:12:17.520359+00	1
1d433090-1ada-4601-852d-10c7b4aa1ab4	4c194a2cefee3cda30465ea34d70423eaadb34b3aac5d9941898a2bc6bed1bb3	2025-05-22 11:12:17.469712+00	20250413052703_add_elo_rating_to_gamefowl	\N	\N	2025-05-22 11:12:17.463126+00	1
cdcd2f38-9e71-46d9-9ff0-d36fc9778f44	36ce86bfb8072a990cfb10340c0d6c2f44468d1ef30cc6a99a484b0d7c1b1414	2025-05-22 11:12:17.479019+00	20250413052834_remove_elo_model	\N	\N	2025-05-22 11:12:17.471775+00	1
f32f041e-9884-43f3-8a8b-3fe880fae76d	edea7d8f5832fe5c12c304f4c14e3c74c60fad435b4f55e0f25689dc3645e1da	2025-05-22 11:12:17.582954+00	20250417101912_add_recurrent_schedules	\N	\N	2025-05-22 11:12:17.576608+00	1
afeed10f-a1f1-4c58-96ef-d2c6b1da4a17	21fa43bf80b3ff80e0d9a8657e3f6b200a773759a045ba383683fa03ad70b149	2025-05-22 11:12:17.493841+00	20250413124554_add_sex_to_gamefowl	\N	\N	2025-05-22 11:12:17.486826+00	1
f2d3e9e5-f51a-4efa-8630-0719e553373e	e5652ed8e2441ceb9fc1591b55bfb5ebeb73a65776e7ca18577017c4c10199f1	2025-05-22 11:12:17.534878+00	20250413152744_add_is_archived_to_breeding	\N	\N	2025-05-22 11:12:17.528861+00	1
9f526d5a-5df5-4ed7-a365-7b1ab0f86ec8	fc874f8ae9eadef5111dac19dfeec95d8e8fa9b304c7e9322a310f6b502e5dce	2025-05-22 11:12:17.543512+00	20250414000000_add_medical_archive	\N	\N	2025-05-22 11:12:17.536941+00	1
9b39ed50-f793-47f8-a1f0-729c8b06a297	05615194fd484ab6fb574ee03d603b8b776a86c8e060fbb70b9dca87ba390b17	2025-05-22 11:12:17.554388+00	20250417030304_add_activities_to_conditioning_program	\N	\N	2025-05-22 11:12:17.545515+00	1
408079cd-d01b-4467-ba87-7afd866d4814	6e9371040fb98d2aefbc13996d03b21a1a14bc0079f245ad3a8d1370912dfd58	2025-05-22 11:12:17.594879+00	20250417104004_change_time_of_day_to_string	\N	\N	2025-05-22 11:12:17.585248+00	1
a9931c8c-9747-4211-a877-501cbec86e8e	b19071194465847432f6c3b6a7bf778ae0ac104bb74fa66d72085af16bdb744e	2025-05-22 11:12:17.566227+00	20250417030431_rename_activity_to_conditioning_activity	\N	\N	2025-05-22 11:12:17.556521+00	1
31812f60-6194-4f3c-9393-77dd393a19b5	949ae514957653c9aca256bba9c333f917e7c6ad953be03d63edb7f3505142de	2025-05-22 11:12:17.60307+00	20250417143330_add_status_to_schedule	\N	\N	2025-05-22 11:12:17.597069+00	1
939f7209-3161-42e8-b8dd-80c4c99814d9	d9f29e419ed906d3d4ae5f253004d37a4ef4625715862550d6f4275689f7dd7f	2025-05-22 11:12:17.6319+00	20250418075856_rename_event_participant_to_event_gamefowl	\N	\N	2025-05-22 11:12:17.622548+00	1
7461bc68-c391-4c73-a9af-d078a2fab8ad	56463932941fffeca6c6d33bc9dc45835ee97c3fc2d09f5f1e014e4063cfe410	2025-05-22 11:12:17.610857+00	20250417144717_add_weekdays_to_recurrent_schedules	\N	\N	2025-05-22 11:12:17.605081+00	1
601fc2ac-3c27-4bae-9418-996eb739e7c6	5130413922ed7b96714575d09e85eeb8dd31003caca99454b1f5ebc0d4704daf	2025-05-22 11:12:17.688174+00	20250419083201_add_handler_role	\N	\N	2025-05-22 11:12:17.682495+00	1
f3364900-b765-4c9f-918a-a7edd2b2d624	35137b4158d9addd414010ae8a54e964bffe6d94c6d77780d325d9698c1d83a9	2025-05-22 11:12:17.642251+00	20250418150931_add_conditioning_gamefowl_join_table	\N	\N	2025-05-22 11:12:17.634172+00	1
94142cd3-02ea-4102-a3b5-453e321f483a	5c2e5c02d102703145971ce06d02f73f452fae80d7425cb83403f48a4423e283	2025-05-22 11:12:17.68035+00	20250419083100_schema_update	\N	\N	2025-05-22 11:12:17.667733+00	1
b5c044ba-c65c-4601-8451-ce5ba7fba1aa	3922edc488351ba613f59891cbf1dfb5dd6943d23ec5e86dd0d7a0c6851a0a51	2025-05-22 11:12:17.657679+00	20250419051733_add_other_event_type	\N	\N	2025-05-22 11:12:17.652118+00	1
c6ec610b-d0d1-4926-8c29-baaa603c76a0	a86949caa90026cb8e49811173cf65e3f7ba665f50fd491d16355aace12ead35	2025-05-22 11:12:17.665703+00	20250419064941_add_other_recurrence_pattern	\N	\N	2025-05-22 11:12:17.659732+00	1
184e1992-fe54-4437-94d1-1181621a9dee	022bf12482a8ab2f943fb88fb7d6827cdf7ec6bf942fb58f552ce922c7473490	2025-05-22 11:12:17.696036+00	20250420073631_add_two_cock_derby	\N	\N	2025-05-22 11:12:17.69028+00	1
0e5ed9c1-e522-42fa-9a94-e523a9e313ce	66f75ec21c9ba26ef971a28d7bacb3de724f072684c6725f342929b512a0c0a1	2025-05-22 11:12:17.70364+00	20250420080850_remove_turning_sched_from_incubation	\N	\N	2025-05-22 11:12:17.698031+00	1
3624aa50-1d47-4468-8746-cc4a8014949c	4ca8500be24734d40d1f9f0679bd13f7d936cbc00dcde6bece56217ca6228721	2025-05-22 11:12:17.712875+00	20250420085148_schema_update	\N	\N	2025-05-22 11:12:17.705747+00	1
c178613c-a4cd-4d60-89c3-a0d08b71d2b9	262cfaa455e2a1eb7b61e898df394c6a8332dc499f4a7d9df71843821a1024bb	2025-05-22 11:12:17.721118+00	20250420103756_add_breeding_to_incubation	\N	\N	2025-05-22 11:12:17.714802+00	1
a187448f-e584-439d-bac1-aaa73142ddae	ca8d8b6a020604fe47cd77be63f058bbd9c71d5a392bce84306d02c4bb8dc0f3	2025-05-22 11:12:17.729507+00	20250420110850_remove_fertility_rate	\N	\N	2025-05-22 11:12:17.72322+00	1
214cee43-2253-484e-be98-bc60f9125435	56463932941fffeca6c6d33bc9dc45835ee97c3fc2d09f5f1e014e4063cfe410	2025-05-22 11:12:17.858386+00	20250428044852_add_weekdays_field	\N	\N	2025-05-22 11:12:17.852174+00	1
efc30844-5451-4d50-b2f5-f27aeba44ed9	88c6449903b074134775da9b4fd54092e38e6105b3f50693bfc44052bc7d3886	2025-05-22 11:12:17.73925+00	20250421062437_add_conditioning_activity_schedules	\N	\N	2025-05-22 11:12:17.731697+00	1
8d902b03-db97-46fc-ae3b-8d36f786cf3c	19d3375e89a1ae717f6a95d2f9aab187b8f0123ba18c0d388932763d2d64e3ee	2025-05-22 11:12:17.748824+00	20250421130720_add_notes_to_conditioning	\N	\N	2025-05-22 11:12:17.741307+00	1
0fbea55a-85e6-47ff-9622-86599fc7f3b1	622d9b581b4f9d5fbf8be766deb5dabb9e095d82e74d59fa5f481396c70b5389	2025-05-22 11:12:17.986512+00	20250513145126_add_completed_status	\N	\N	2025-05-22 11:12:17.980624+00	1
ae1775c2-d0b9-4901-b895-f4be68907fb4	1fb38585de25a4f486d634d12232074a590794ab63ac6d62a7cd8735b5346518	2025-05-22 11:12:17.756768+00	20250424142700_add_recurrence_fields	\N	\N	2025-05-22 11:12:17.750829+00	1
784ca4be-b87d-457a-89df-47bbf4ce5e8c	0e5686e9cea9518261a6b9954a95e55f6375cdff74725916bda0e4ece72cc3c9	2025-05-22 11:12:17.870051+00	20250501082427_add_cascade_deletes	\N	\N	2025-05-22 11:12:17.860487+00	1
0a3b1b4c-947b-44ad-bab2-98894d54235c	46736e10f41857c40af9b7ebcde94a9bc1d11f9ea959005961b3587c48aac76c	2025-05-22 11:12:17.767804+00	20250424144004_remove_monthly_option	\N	\N	2025-05-22 11:12:17.758759+00	1
9e4cf3b1-f4c5-43ce-8db4-ed355bee7e89	4ec080e25200d2e9b6ee792b4cb75dca99c2ef6393f9594313416450979ff4d8	2025-05-22 11:12:17.775921+00	20250425035236_add_missing_recurrent_schedule_fields	\N	\N	2025-05-22 11:12:17.769887+00	1
9cff7312-4a37-49ad-b8d6-2d4588c89f60	d89ef553cc1d7b8b2f8b62aea88f864fc23d1025505d2bfc1de30548670b1842	2025-05-22 11:12:17.943626+00	20250510065554_end_date_optional	\N	\N	2025-05-22 11:12:17.937626+00	1
6edce3d5-85b2-4f2c-93e9-74093aa1d8bc	d75af5980d133827901c7baa115c05b5066f3b2b96230c9c953c30ec28813dcf	2025-05-22 11:12:17.783968+00	20250427034157_add_elo_fields_to_sparring	\N	\N	2025-05-22 11:12:17.777992+00	1
4d40118a-1b5b-4f04-98bd-12bdd26d61cb	2fde8ba8c1e2dba608c067db675de2ee9a92a9aad8587d3d8cafcc1430be1a28	2025-05-22 11:12:17.882187+00	20250504095416_make_event_id_optional	\N	\N	2025-05-22 11:12:17.871958+00	1
1181def7-bf06-43a8-98ae-58aec0e22511	72a47ee2358b4cd2a2c1a6fdb5c95a41585772922d3efb40c3e2c8e07fa72ccd	2025-05-22 11:12:17.801995+00	20250427111223_update_status_enums	\N	\N	2025-05-22 11:12:17.786049+00	1
51f09756-a758-4c34-b2cd-d9a42bbec008	572932639b0e2f2dff03547abc8682d339c5cea36619bbaf8a57d3816ab00861	2025-05-22 11:12:17.812195+00	20250427124649_add_recurring_task_completion	\N	\N	2025-05-22 11:12:17.804179+00	1
8f051252-53a4-474f-9a83-c32b4ea465e8	8d878fc53d4eb8baa051c44e20e016c8c57984ded1594ffa0f0fdb4f830a80c7	2025-05-22 11:12:17.825754+00	20250428023403_update_recurrence_pattern_enum	\N	\N	2025-05-22 11:12:17.814237+00	1
2ea73e97-e25c-406b-9e46-efa0067b3bce	04d668b34416d86e040cd8b80fd70ce9f21f3b1aeacb2f02530f80aa3b72ca64	2025-05-22 11:12:17.890428+00	20250504122330_make_dates_optional	\N	\N	2025-05-22 11:12:17.884266+00	1
a7e4cbc0-d658-4da2-8354-63873b500596	731a08d9818d59e65e160f3efcd2bc60968b59294842d26d77982d768bbf8281	2025-05-22 11:12:17.834074+00	20250428030000_fix_weekdays_column	\N	\N	2025-05-22 11:12:17.827963+00	1
f7628a6c-b51a-42f1-82a5-a270ff84a6e8	9e8f90842937925f566ee705c01cc73a7d907454679f8b72da64d74b189925d8	2025-05-22 11:12:17.841874+00	20250428044745_fix_weekdays_column	\N	\N	2025-05-22 11:12:17.835961+00	1
125705b3-30a8-4d6e-ba8b-e8ba74dd3074	0d6f21486a62bdc436f51070e481455977b09fe52fb40707c10323986d72ce9b	2025-05-22 11:12:17.850037+00	20250428044820_fix_weekydays_column	\N	\N	2025-05-22 11:12:17.843821+00	1
cfe85e7d-e9aa-4232-a6ea-d6bf8095cae7	8b2fcfe253d7f65f4c76ab50509b1cb2c73a5e639682f92b685c53cc62269e26	2025-05-22 11:12:17.951338+00	20250511042752_add_repeat_indefinitely	\N	\N	2025-05-22 11:12:17.945589+00	1
690b4b51-e908-4f90-a563-6415df8e40cd	ec509481b4590cb417a15787252502ff39e1fd4e1422b5ae3d13a3885080b6c2	2025-05-22 11:12:17.898644+00	20250504122653_make_dates_required	\N	\N	2025-05-22 11:12:17.892462+00	1
8a30961e-0863-494a-b2db-b314cfa77783	b525e6d0e18ea34af76cf6ea61a3cb009307ced13548c888c4f9b7c9e99e70b2	2025-05-22 11:12:17.909666+00	20250504160159_add_recurrent_custom_dates	\N	\N	2025-05-22 11:12:17.900909+00	1
1efe2c2b-128e-487c-9d40-f9b849baceab	21cbd1f800221434cf45a571842286979d206496c5e8e4e40d24f8026b0ff7b8	2025-05-22 11:12:17.918389+00	20250504161848_remove_recurrent_custom_dates	\N	\N	2025-05-22 11:12:17.911723+00	1
067f1436-46d6-47c6-b023-ee6174aeb047	5f1fe2509a83337340cdf93c1d7f6277ac3351c1abb9b72df3b01d29f6c59036	2025-05-22 11:12:17.960295+00	20250511083710_add_repeat_indefinitely	\N	\N	2025-05-22 11:12:17.953304+00	1
c6e57f2e-5710-42e9-9bb4-cbb0c82e5f0a	def4896429d7b2b3b11c6d367f5545f30ab3d1aab8bfb25a60332dbeba5fee64	2025-05-22 11:12:17.926443+00	20250504162826_update_custom_date_type	\N	\N	2025-05-22 11:12:17.920473+00	1
ea49e048-7cf1-4330-8de9-2d1e2103622d	fb0cbc671a66c65b457dccc46fe3fad74b5cea2ddbc102391366c87f7be1bd7a	2025-05-22 11:12:17.935601+00	20250504162857_update_custom_date_storage	\N	\N	2025-05-22 11:12:17.92845+00	1
2a24a532-eb2c-41eb-a40a-b1fd375cf65b	32f0570de61110567099720f1f4a719695cb585258f5019a596321057e7b6b72	2025-05-22 11:12:17.997672+00	20250513145341_remove_completed_status	\N	\N	2025-05-22 11:12:17.988559+00	1
41c45a90-895b-43aa-8feb-a34656e024b8	4ad610370584d23f707d9ee91a1dba5b3334eecdb5999b35b91328c8781282fc	2025-05-22 11:12:17.968802+00	20250511135444_add_gamefowl_status	\N	\N	2025-05-22 11:12:17.96245+00	1
6b02c903-ecf9-4e98-ae8f-9ad2b5835284	5247c4381e99826bc1230251aae245d39d94285b3f6282a118dffb61ab6527c8	2025-05-22 11:12:17.978632+00	20250513145009_add_event_results	\N	\N	2025-05-22 11:12:17.970828+00	1
a3a76e2a-1584-44eb-886e-7d14bf4b2f2e	32846b9abab7a1e4597564f94a78c985190ca7ca567c46459d04fd5400442100	2025-05-22 11:12:18.006598+00	20250513160824_add_cascade_delete_to_conditioning	\N	\N	2025-05-22 11:12:17.999793+00	1
bd25b206-8eaa-4198-81a2-6d477ed00cd4	35d5e75546c388afd01cb5b6ea6a8255bb8adcba8f56e1edb0ca9cc2346e8a0a	2025-05-22 11:12:18.018032+00	20250513162113_add_cascade_delete_to_events	\N	\N	2025-05-22 11:12:18.00853+00	1
\.


--
-- Name: Batch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nieves
--

SELECT pg_catalog.setval('public."Batch_id_seq"', 1, false);


--
-- Name: Breeding_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nieves
--

SELECT pg_catalog.setval('public."Breeding_id_seq"', 1, false);


--
-- Name: ConditioningActivitySchedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nieves
--

SELECT pg_catalog.setval('public."ConditioningActivitySchedule_id_seq"', 1, false);


--
-- Name: ConditioningActivity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nieves
--

SELECT pg_catalog.setval('public."ConditioningActivity_id_seq"', 1, false);


--
-- Name: ConditioningGamefowl_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nieves
--

SELECT pg_catalog.setval('public."ConditioningGamefowl_id_seq"', 1, false);


--
-- Name: ConditioningProgram_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nieves
--

SELECT pg_catalog.setval('public."ConditioningProgram_id_seq"', 1, false);


--
-- Name: Conditioning_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nieves
--

SELECT pg_catalog.setval('public."Conditioning_id_seq"', 1, false);


--
-- Name: Deworming_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nieves
--

SELECT pg_catalog.setval('public."Deworming_id_seq"', 1, false);


--
-- Name: EventGamefowl_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nieves
--

SELECT pg_catalog.setval('public."EventGamefowl_id_seq"', 1, false);


--
-- Name: EventResult_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nieves
--

SELECT pg_catalog.setval('public."EventResult_id_seq"', 1, false);


--
-- Name: Event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nieves
--

SELECT pg_catalog.setval('public."Event_id_seq"', 1, false);


--
-- Name: Gamefowl_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nieves
--

SELECT pg_catalog.setval('public."Gamefowl_id_seq"', 10, true);


--
-- Name: Incubation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nieves
--

SELECT pg_catalog.setval('public."Incubation_id_seq"', 1, false);


--
-- Name: OneTimeSched_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nieves
--

SELECT pg_catalog.setval('public."OneTimeSched_id_seq"', 1, false);


--
-- Name: RecurrentSchedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nieves
--

SELECT pg_catalog.setval('public."RecurrentSchedules_id_seq"', 2, true);


--
-- Name: RecurringTaskCompletion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nieves
--

SELECT pg_catalog.setval('public."RecurringTaskCompletion_id_seq"', 1, false);


--
-- Name: Schedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nieves
--

SELECT pg_catalog.setval('public."Schedule_id_seq"', 2, true);


--
-- Name: Sparring_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nieves
--

SELECT pg_catalog.setval('public."Sparring_id_seq"', 1, false);


--
-- Name: Vaccine_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nieves
--

SELECT pg_catalog.setval('public."Vaccine_id_seq"', 1, true);


--
-- Name: Admin Admin_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Admin"
    ADD CONSTRAINT "Admin_pkey" PRIMARY KEY (id);


--
-- Name: Batch Batch_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Batch"
    ADD CONSTRAINT "Batch_pkey" PRIMARY KEY (id);


--
-- Name: Breeder Breeder_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Breeder"
    ADD CONSTRAINT "Breeder_pkey" PRIMARY KEY (id);


--
-- Name: Breeding Breeding_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Breeding"
    ADD CONSTRAINT "Breeding_pkey" PRIMARY KEY (id);


--
-- Name: ConditioningActivitySchedule ConditioningActivitySchedule_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."ConditioningActivitySchedule"
    ADD CONSTRAINT "ConditioningActivitySchedule_pkey" PRIMARY KEY (id);


--
-- Name: ConditioningActivity ConditioningActivity_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."ConditioningActivity"
    ADD CONSTRAINT "ConditioningActivity_pkey" PRIMARY KEY (id);


--
-- Name: ConditioningGamefowl ConditioningGamefowl_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."ConditioningGamefowl"
    ADD CONSTRAINT "ConditioningGamefowl_pkey" PRIMARY KEY (id);


--
-- Name: ConditioningProgram ConditioningProgram_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."ConditioningProgram"
    ADD CONSTRAINT "ConditioningProgram_pkey" PRIMARY KEY (id);


--
-- Name: Conditioning Conditioning_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Conditioning"
    ADD CONSTRAINT "Conditioning_pkey" PRIMARY KEY (id);


--
-- Name: Deworming Deworming_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Deworming"
    ADD CONSTRAINT "Deworming_pkey" PRIMARY KEY (id);


--
-- Name: EventGamefowl EventGamefowl_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."EventGamefowl"
    ADD CONSTRAINT "EventGamefowl_pkey" PRIMARY KEY (id);


--
-- Name: EventResult EventResult_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."EventResult"
    ADD CONSTRAINT "EventResult_pkey" PRIMARY KEY (id);


--
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- Name: Gamefowl Gamefowl_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Gamefowl"
    ADD CONSTRAINT "Gamefowl_pkey" PRIMARY KEY (id);


--
-- Name: Handler Handler_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Handler"
    ADD CONSTRAINT "Handler_pkey" PRIMARY KEY (id);


--
-- Name: Incubation Incubation_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Incubation"
    ADD CONSTRAINT "Incubation_pkey" PRIMARY KEY (id);


--
-- Name: OneTimeSched OneTimeSched_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."OneTimeSched"
    ADD CONSTRAINT "OneTimeSched_pkey" PRIMARY KEY (id);


--
-- Name: RecurrentSchedules RecurrentSchedules_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."RecurrentSchedules"
    ADD CONSTRAINT "RecurrentSchedules_pkey" PRIMARY KEY (id);


--
-- Name: RecurringTaskCompletion RecurringTaskCompletion_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."RecurringTaskCompletion"
    ADD CONSTRAINT "RecurringTaskCompletion_pkey" PRIMARY KEY (id);


--
-- Name: Schedule Schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Schedule"
    ADD CONSTRAINT "Schedule_pkey" PRIMARY KEY (id);


--
-- Name: Sparring Sparring_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Sparring"
    ADD CONSTRAINT "Sparring_pkey" PRIMARY KEY (id);


--
-- Name: Vaccine Vaccine_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Vaccine"
    ADD CONSTRAINT "Vaccine_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Admin_username_key; Type: INDEX; Schema: public; Owner: nieves
--

CREATE UNIQUE INDEX "Admin_username_key" ON public."Admin" USING btree (username);


--
-- Name: Breeder_email_key; Type: INDEX; Schema: public; Owner: nieves
--

CREATE UNIQUE INDEX "Breeder_email_key" ON public."Breeder" USING btree (email);


--
-- Name: Breeder_username_key; Type: INDEX; Schema: public; Owner: nieves
--

CREATE UNIQUE INDEX "Breeder_username_key" ON public."Breeder" USING btree (username);


--
-- Name: ConditioningActivitySchedule_activityId_idx; Type: INDEX; Schema: public; Owner: nieves
--

CREATE INDEX "ConditioningActivitySchedule_activityId_idx" ON public."ConditioningActivitySchedule" USING btree ("activityId");


--
-- Name: ConditioningActivitySchedule_conditioningId_idx; Type: INDEX; Schema: public; Owner: nieves
--

CREATE INDEX "ConditioningActivitySchedule_conditioningId_idx" ON public."ConditioningActivitySchedule" USING btree ("conditioningId");


--
-- Name: ConditioningGamefowl_conditioningId_gamefowlId_key; Type: INDEX; Schema: public; Owner: nieves
--

CREATE UNIQUE INDEX "ConditioningGamefowl_conditioningId_gamefowlId_key" ON public."ConditioningGamefowl" USING btree ("conditioningId", "gamefowlId");


--
-- Name: EventGamefowl_eventId_gamefowlId_key; Type: INDEX; Schema: public; Owner: nieves
--

CREATE UNIQUE INDEX "EventGamefowl_eventId_gamefowlId_key" ON public."EventGamefowl" USING btree ("eventId", "gamefowlId");


--
-- Name: EventResult_eventId_gamefowlId_key; Type: INDEX; Schema: public; Owner: nieves
--

CREATE UNIQUE INDEX "EventResult_eventId_gamefowlId_key" ON public."EventResult" USING btree ("eventId", "gamefowlId");


--
-- Name: Handler_email_key; Type: INDEX; Schema: public; Owner: nieves
--

CREATE UNIQUE INDEX "Handler_email_key" ON public."Handler" USING btree (email);


--
-- Name: Handler_username_key; Type: INDEX; Schema: public; Owner: nieves
--

CREATE UNIQUE INDEX "Handler_username_key" ON public."Handler" USING btree (username);


--
-- Name: RecurrentSchedules_schedId_idx; Type: INDEX; Schema: public; Owner: nieves
--

CREATE INDEX "RecurrentSchedules_schedId_idx" ON public."RecurrentSchedules" USING btree ("schedId");


--
-- Name: RecurringTaskCompletion_date_idx; Type: INDEX; Schema: public; Owner: nieves
--

CREATE INDEX "RecurringTaskCompletion_date_idx" ON public."RecurringTaskCompletion" USING btree (date);


--
-- Name: RecurringTaskCompletion_recurrentId_date_key; Type: INDEX; Schema: public; Owner: nieves
--

CREATE UNIQUE INDEX "RecurringTaskCompletion_recurrentId_date_key" ON public."RecurringTaskCompletion" USING btree ("recurrentId", date);


--
-- Name: RecurringTaskCompletion_recurrentId_idx; Type: INDEX; Schema: public; Owner: nieves
--

CREATE INDEX "RecurringTaskCompletion_recurrentId_idx" ON public."RecurringTaskCompletion" USING btree ("recurrentId");


--
-- Name: Batch Batch_incubate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Batch"
    ADD CONSTRAINT "Batch_incubate_id_fkey" FOREIGN KEY (incubate_id) REFERENCES public."Incubation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Breeding Breeding_damId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Breeding"
    ADD CONSTRAINT "Breeding_damId_fkey" FOREIGN KEY ("damId") REFERENCES public."Gamefowl"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Breeding Breeding_sireId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Breeding"
    ADD CONSTRAINT "Breeding_sireId_fkey" FOREIGN KEY ("sireId") REFERENCES public."Gamefowl"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ConditioningActivitySchedule ConditioningActivitySchedule_activityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."ConditioningActivitySchedule"
    ADD CONSTRAINT "ConditioningActivitySchedule_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES public."ConditioningActivity"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ConditioningActivitySchedule ConditioningActivitySchedule_conditioningId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."ConditioningActivitySchedule"
    ADD CONSTRAINT "ConditioningActivitySchedule_conditioningId_fkey" FOREIGN KEY ("conditioningId") REFERENCES public."Conditioning"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ConditioningActivity ConditioningActivity_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."ConditioningActivity"
    ADD CONSTRAINT "ConditioningActivity_programId_fkey" FOREIGN KEY ("programId") REFERENCES public."ConditioningProgram"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ConditioningGamefowl ConditioningGamefowl_conditioningId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."ConditioningGamefowl"
    ADD CONSTRAINT "ConditioningGamefowl_conditioningId_fkey" FOREIGN KEY ("conditioningId") REFERENCES public."Conditioning"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ConditioningGamefowl ConditioningGamefowl_gamefowlId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."ConditioningGamefowl"
    ADD CONSTRAINT "ConditioningGamefowl_gamefowlId_fkey" FOREIGN KEY ("gamefowlId") REFERENCES public."Gamefowl"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Conditioning Conditioning_conProgId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Conditioning"
    ADD CONSTRAINT "Conditioning_conProgId_fkey" FOREIGN KEY ("conProgId") REFERENCES public."ConditioningProgram"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Conditioning Conditioning_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Conditioning"
    ADD CONSTRAINT "Conditioning_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Conditioning Conditioning_handlerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Conditioning"
    ADD CONSTRAINT "Conditioning_handlerId_fkey" FOREIGN KEY ("handlerId") REFERENCES public."Handler"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Deworming Deworming_gamefowlId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Deworming"
    ADD CONSTRAINT "Deworming_gamefowlId_fkey" FOREIGN KEY ("gamefowlId") REFERENCES public."Gamefowl"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EventGamefowl EventGamefowl_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."EventGamefowl"
    ADD CONSTRAINT "EventGamefowl_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventGamefowl EventGamefowl_gamefowlId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."EventGamefowl"
    ADD CONSTRAINT "EventGamefowl_gamefowlId_fkey" FOREIGN KEY ("gamefowlId") REFERENCES public."Gamefowl"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EventResult EventResult_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."EventResult"
    ADD CONSTRAINT "EventResult_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventResult EventResult_gamefowlId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."EventResult"
    ADD CONSTRAINT "EventResult_gamefowlId_fkey" FOREIGN KEY ("gamefowlId") REFERENCES public."Gamefowl"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Event Event_handlerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_handlerId_fkey" FOREIGN KEY ("handlerId") REFERENCES public."Handler"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Gamefowl Gamefowl_damId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Gamefowl"
    ADD CONSTRAINT "Gamefowl_damId_fkey" FOREIGN KEY ("damId") REFERENCES public."Gamefowl"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Gamefowl Gamefowl_sireId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Gamefowl"
    ADD CONSTRAINT "Gamefowl_sireId_fkey" FOREIGN KEY ("sireId") REFERENCES public."Gamefowl"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Incubation Incubation_breedingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Incubation"
    ADD CONSTRAINT "Incubation_breedingId_fkey" FOREIGN KEY ("breedingId") REFERENCES public."Breeding"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OneTimeSched OneTimeSched_schedId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."OneTimeSched"
    ADD CONSTRAINT "OneTimeSched_schedId_fkey" FOREIGN KEY ("schedId") REFERENCES public."Schedule"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RecurrentSchedules RecurrentSchedules_schedId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."RecurrentSchedules"
    ADD CONSTRAINT "RecurrentSchedules_schedId_fkey" FOREIGN KEY ("schedId") REFERENCES public."Schedule"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RecurringTaskCompletion RecurringTaskCompletion_recurrentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."RecurringTaskCompletion"
    ADD CONSTRAINT "RecurringTaskCompletion_recurrentId_fkey" FOREIGN KEY ("recurrentId") REFERENCES public."RecurrentSchedules"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Sparring Sparring_gamefowl_1_Id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Sparring"
    ADD CONSTRAINT "Sparring_gamefowl_1_Id_fkey" FOREIGN KEY ("gamefowl_1_Id") REFERENCES public."Gamefowl"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Sparring Sparring_gamefowl_2_Id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Sparring"
    ADD CONSTRAINT "Sparring_gamefowl_2_Id_fkey" FOREIGN KEY ("gamefowl_2_Id") REFERENCES public."Gamefowl"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Sparring Sparring_loserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Sparring"
    ADD CONSTRAINT "Sparring_loserId_fkey" FOREIGN KEY ("loserId") REFERENCES public."Gamefowl"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Sparring Sparring_winnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Sparring"
    ADD CONSTRAINT "Sparring_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES public."Gamefowl"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Vaccine Vaccine_gamefowlId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nieves
--

ALTER TABLE ONLY public."Vaccine"
    ADD CONSTRAINT "Vaccine_gamefowlId_fkey" FOREIGN KEY ("gamefowlId") REFERENCES public."Gamefowl"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: nieves
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

