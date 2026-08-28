/** Stub de @nestjs/swagger para tests (el paquete real es ESM puro). */
const decorator = () => () => undefined;

export const ApiTags = (..._args: unknown[]) => decorator();
export const ApiBearerAuth = (..._args: unknown[]) => decorator();
export const ApiOperation = (..._args: unknown[]) => decorator();
export const ApiResponse = (..._args: unknown[]) => decorator();
export const ApiProperty = (..._args: unknown[]) => decorator();
export const ApiPropertyOptional = (..._args: unknown[]) => decorator();
export const ApiQuery = (..._args: unknown[]) => decorator();
export const ApiParam = (..._args: unknown[]) => decorator();
export const ApiBody = (..._args: unknown[]) => decorator();
export const ApiSecurity = (..._args: unknown[]) => decorator();
export const PartialType = <T>(c: new () => T): new () => T => c;
export class DocumentBuilder {
  setTitle() { return this; }
  setDescription() { return this; }
  setVersion() { return this; }
  addBearerAuth() { return this; }
  addApiKey() { return this; }
  build() { return {}; }
}
export const SwaggerModule = {
  createDocument: () => ({}),
  setup: () => undefined,
};
