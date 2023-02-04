export const getSort = (orderBy: any) => {
  if (orderBy !== null) {
    if (orderBy === "id_ASC") {
      return {
        _id: 1,
      };
    } else if (orderBy === "id_DESC") {
      return {
        _id: -1,
      };
    } else if (orderBy === "title_ASC") {
      return {
        title: 1,
      };
    } else if (orderBy === "title_DESC") {
      return {
        title: -1,
      };
    } else if (orderBy === "description_ASC") {
      return {
        description: 1,
      };
    } else if (orderBy === "description_DESC") {
      return {
        description: -1,
      };
    } else if (orderBy === "startDate_ASC") {
      return {
        startDate: 1,
      };
    } else if (orderBy === "startDate_DESC") {
      return {
        startDate: -1,
      };
    } else if (orderBy === "endDate_ASC") {
      return {
        endDate: 1,
      };
    } else if (orderBy === "endDate_DESC") {
      return {
        endDate: -1,
      };
    } else if (orderBy === "allDay_ASC") {
      return {
        allDay: 1,
      };
    } else if (orderBy === "allDay_DESC") {
      return {
        allDay: -1,
      };
    } else if (orderBy === "startTime_ASC") {
      return {
        startTime: 1,
      };
    } else if (orderBy === "startTime_DESC") {
      return {
        startTime: -1,
      };
    } else if (orderBy === "endTime_ASC") {
      return {
        endTime: 1,
      };
    } else if (orderBy === "endTime_DESC") {
      return {
        endTime: -1,
      };
    } else if (orderBy === "recurrance_ASC") {
      return {
        recurrance: 1,
      };
    } else if (orderBy === "recurrance_DESC") {
      return {
        recurrance: -1,
      };
    } else if (orderBy === "location_ASC") {
      return {
        location: 1,
      };
    } else if (orderBy === "location_DESC") {
      return {
        location: -1,
      };
    } else if (orderBy === "createdAt_ASC") {
      return {
        createdAt: 1,
      };
    } else if (orderBy === "createdAt_DESC") {
      return {
        createdAt: -1,
      };
    } else if (orderBy === "deadline_ASC") {
      return {
        deadline: 1,
      };
    } else if (orderBy === "deadline_DESC") {
      return {
        deadline: -1,
      };
    }
  }

  return {};
};
