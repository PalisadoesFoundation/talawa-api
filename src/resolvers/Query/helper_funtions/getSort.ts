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
    } else if (orderBy === "name_ASC") {
      return {
        name: 1,
      };
    } else if (orderBy === "name_DESC") {
      return {
        name: -1,
      };
    } else if (orderBy === "apiUrl_ASC") {
      return {
        apiUrl: 1,
      };
    } else if (orderBy === "apiUrl_DESC") {
      return {
        apiUrl: -1,
      };
    } else if (orderBy === "firstName_ASC") {
      return {
        firstName: 1,
      };
    } else if (orderBy === "firstName_DESC") {
      return {
        firstName: -1,
      };
    } else if (orderBy === "lastName_ASC") {
      return {
        lastName: 1,
      };
    } else if (orderBy === "lastName_DESC") {
      return {
        lastName: -1,
      };
    } else if (orderBy === "appLanguageCode_ASC") {
      return {
        appLanguageCode: 1,
      };
    } else if (orderBy === "appLanguageCode_DESC") {
      return {
        appLanguageCode: -1,
      };
    } else if (orderBy === "email_ASC") {
      return {
        email: 1,
      };
    } else if (orderBy === "email_DESC") {
      return {
        email: -1,
      };
    } else if (orderBy === "text_ASC") {
      return { text: 1 };
    } else if (orderBy === "text_DESC") {
      return { text: -1 };
    } else if (orderBy === "imageUrl_ASC") {
      return { imageUrl: 1 };
    } else if (orderBy === "imageUrl_DESC") {
      return { imageUrl: -1 };
    } else if (orderBy === "videoUrl_ASC") {
      return { videoUrl: 1 };
    } else if (orderBy === "videoUrl_DESC") {
      return { videoUrl: -1 };
    } else if (orderBy === "likeCount_ASC") {
      return { likeCount: 1 };
    } else if (orderBy === "likeCount_DESC") {
      return { likeCount: -1 };
    } else if (orderBy === "commentCount_ASC") {
      return { commentCount: 1 };
    } else if (orderBy === "commentCount_DESC") {
      return { commentCount: -1 };
    }
  }

  return {};
};
