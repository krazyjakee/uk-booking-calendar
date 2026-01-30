import builder from "./builder";

// Import types (registers them with the builder)
import "./types/enums";
import "./types/customer";
import "./types/tradesman";
import "./types/booking";
import "./types/holiday";
import "./types/availability";
import "./types/user";
import "./types/chat";

// Import inputs (registers them with the builder)
import "./inputs/booking";
import "./inputs/auth";
import "./inputs/chat";

// Import queries (registers them with the builder)
import "./queries/availability";
import "./queries/bookings";
import "./queries/tradesman";
import "./queries/holidays";
import "./queries/auth";
import "./queries/chat";

// Import mutations (registers them with the builder)
import "./mutations/bookings";
import "./mutations/recurring";
import "./mutations/multi-day";
import "./mutations/tradesman";
import "./mutations/holidays";
import "./mutations/auth";
import "./mutations/chat";

export const schema = builder.toSchema();
