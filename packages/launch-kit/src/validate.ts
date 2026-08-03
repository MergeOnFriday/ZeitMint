import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import launchKitSchema from "../schemas/launch-kit.schema.json";
import readinessReportSchema from "../schemas/readiness-report.schema.json";
import utilityManifestSchema from "../schemas/utility-manifest.schema.json";
import type { ZeitMintLaunchKit } from "./launch-kit.js";
import type { ReadinessReport } from "./readiness.js";
import type { ZeitMintUtilityManifest } from "./utility-manifest.js";

export type ValidationIssue = {
  path: string;
  code: string;
  message: string;
};

export type ValidationResult<T> =
  | { valid: true; value: T; issues: [] }
  | { valid: false; issues: ValidationIssue[] };

export class ZeitMintValidationError extends Error {
  readonly issues: ValidationIssue[];

  constructor(message: string, issues: ValidationIssue[]) {
    super(message);
    this.name = "ZeitMintValidationError";
    this.issues = issues;
  }
}

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  validateFormats: true,
});
addFormats(ajv);

const launchKitValidator = ajv.compile<ZeitMintLaunchKit>(launchKitSchema);
const utilityManifestValidator =
  ajv.compile<ZeitMintUtilityManifest>(utilityManifestSchema);
const readinessReportValidator = ajv.compile<ReadinessReport>(readinessReportSchema);

function toIssues(errors: ErrorObject[] | null | undefined): ValidationIssue[] {
  return (errors ?? []).map((error) => ({
    path: error.instancePath || "/",
    code: error.keyword,
    message: error.message ?? "Value is invalid.",
  }));
}

function validateWith<T>(validator: ValidateFunction<T>, input: unknown): ValidationResult<T> {
  if (validator(input)) return { valid: true, value: input, issues: [] };
  return { valid: false, issues: toIssues(validator.errors) };
}

function parseWith<T>(label: string, result: ValidationResult<T>): T {
  if (result.valid) return result.value;
  throw new ZeitMintValidationError(`${label} failed validation.`, result.issues);
}

export function validateLaunchKit(input: unknown) {
  return validateWith(launchKitValidator, input);
}

export function validateUtilityManifest(input: unknown) {
  return validateWith(utilityManifestValidator, input);
}

export function validateReadinessReport(input: unknown) {
  return validateWith(readinessReportValidator, input);
}

export function parseLaunchKit(input: unknown) {
  return parseWith("Launch Kit", validateLaunchKit(input));
}

export function parseUtilityManifest(input: unknown) {
  return parseWith("Utility Manifest", validateUtilityManifest(input));
}

export function parseReadinessReport(input: unknown) {
  return parseWith("Readiness report", validateReadinessReport(input));
}
