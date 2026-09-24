// components/category-manager/check-names.ts
// The two names a category or subcategory editor holds, checked with the schema its actions parse.
import { parsedOrToast } from "@/components/forms/schema-check";
import { categoryInput } from "@/lib/schemas/menu";
import type { Names } from "./types";

/** The names as `categoryInput` parses them (trimmed, both languages), or null after a toast saying why not. */
export const checkNames = (names: Names) => parsedOrToast(categoryInput, { nameEn: names.en, nameFr: names.fr });
