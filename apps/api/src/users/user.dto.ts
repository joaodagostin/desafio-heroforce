import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsByteLength, IsIn, IsString, Length, IsEnum, ValidateIf } from 'class-validator';
import { CHARACTERS, Role } from '../common/domain';
export class RegisterDto {
  @ApiProperty({ example: 'Peter Parker' })
  @IsString()
  @Length(2, 100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;
  @ApiProperty({ example: 'peter@heroforce.dev' })
  @IsEmail()
  @Length(3, 180)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;
  @ApiProperty({ enum: CHARACTERS }) @IsIn(CHARACTERS) character!: string;
  @ApiProperty({ minLength: 8, maxLength: 72, example: 'Hero@12345' })
  @IsString()
  @Length(8, 72)
  @IsByteLength(8, 72)
  password!: string;
}
export class CreateUserDto extends RegisterDto {
  @ApiPropertyOptional({ enum: Role, default: Role.HERO })
  @ValidateIf((_o, v) => v !== undefined)
  @IsEnum(Role)
  role?: Role;
}
export class UpdateProfileDto extends PartialType(OmitType(RegisterDto, ['password'] as const), {
  skipNullProperties: false,
}) {}
export class UpdateUserDto extends UpdateProfileDto {
  @ApiPropertyOptional({ enum: Role })
  @ValidateIf((_o, v) => v !== undefined)
  @IsEnum(Role)
  role?: Role;
}
export class LoginDto {
  @ApiProperty({ example: 'admin@heroforce.dev' })
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;
  @ApiProperty({ example: 'Hero@12345' })
  @IsString()
  @Length(1, 72)
  @IsByteLength(1, 72)
  password!: string;
}
