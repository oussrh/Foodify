// components/category-manager/types.ts
// The category tree the two managers (admin, manager) edit: the rows the menu actions return,
// plus the client-side `isActive` flag, and the bilingual name as the inputs hold it.

export type Subcategory = {
  id: string;
  nameEn: string;
  nameFr: string;
  sortOrder: number;
  isActive?: boolean;
};

export type Category = {
  id: string;
  nameEn: string;
  nameFr: string;
  sortOrder: number;
  isActive?: boolean;
  subcategories: Subcategory[];
};

/** A name in both languages, as typed. */
export type Names = { en: string; fr: string };

/** The add-subcategory drafts, one per category id. */
export type SubDrafts = Record<string, Names>;
