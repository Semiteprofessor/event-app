import { objectType, inputObjectType, mutationField, nonNull } from "nexus";
import { Context } from "../../context.js";

export const InstallmentConfig = objectType({
  name: "InstallmentConfig",
  definition(t) {
    t.int("numberOfInstallments");
    t.float("minPerInstallment");
  },
});
