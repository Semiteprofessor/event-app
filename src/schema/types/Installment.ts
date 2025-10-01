import { objectType, inputObjectType } from "nexus";

export const InstallmentConfig = objectType({
  name: "InstallmentConfig",
  definition(t) {
    t.int("numberOfInstallments");
    t.float("minPerInstallment");
  },
});

export const InstallmentConfigInput = inputObjectType({
  name: "InstallmentConfigInput",
  definition(t) {
    t.int("numberOfInstallments");
    t.float("minPerInstallment");
  },
});
