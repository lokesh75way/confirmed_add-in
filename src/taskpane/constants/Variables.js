const invitationStatusMapping = {
  1: "Pending",
  //Confirmed is known as Accepted in the API. Changed for display purposes
  2: "Confirmed",
  3: "Cancelled",
  4: "Rejected",
  5: "Countered",
  6: "Changed",
  //Withdrawn is known as Rescinded in the API. Changed for display purposes
  7: "Withdrawn",
};

const attendeeInputType = {
	Email: Symbol("email"),
	FirstName: Symbol("firstName"),
	LastName: Symbol("lastName"),
}

export const prefillInfoType = {
  FirstName: { id: "firstName", description: "firstName" },
  LastName: { id: "lastName", description: "lastName" },
  Email: { id: "email", description: "email" },
  Phone: { id: "phone", description: "phone" },
  Subject: { id: "subject", description: "subject" },
};

export { invitationStatusMapping, attendeeInputType };
