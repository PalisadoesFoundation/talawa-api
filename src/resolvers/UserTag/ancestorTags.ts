import type { InterfaceOrganizationTagUser } from "../../models";
import { OrganizationTagUser } from "../../models";
import type { UserTagResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Resolver function for the `ancestorTags` field of an `OrganizationTagUser`.
 *
 * This function retrieves the ancestor tags of a specific organization user tag by recursively finding
 * each parent tag until the root tag (where parentTagId is null) is reached. It then reverses the order,
 * appends the current tag at the end, and returns the final array of tags.
 *
 * @param parent - The parent object representing the user tag. It contains information about the tag, including its ID and parentTagId.
 * @returns A promise that resolves to the ordered array of ancestor tag documents found in the database.
 */
export const ancestorTags: UserTagResolvers["ancestorTags"] = async (
  parent,
) => {
  // Initialize an array to collect the ancestor tags
  const ancestorTags: InterfaceOrganizationTagUser[] = [];

  // Start with the current parentTagId
  let currentParentId = parent.parentTagId;

  // Traverse up the hierarchy to find all ancestorTags
  while (currentParentId) {
    const tag = await OrganizationTagUser.findById(currentParentId).lean();

    if (!tag) break;

    // Add the found tag to the ancestorTags array
    ancestorTags.push(tag);

    // Move up to the next parent
    currentParentId = tag.parentTagId;
  }

  // Reverse the ancestorTags to have the root tag first, then append the current tag
  ancestorTags.reverse();

  return ancestorTags;
};
