import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsString,
  IsUUID,
  Length,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ProjectStatus, Value } from '../common/domain';
export class GoalDto {
  @ApiProperty({ enum: Value }) @IsEnum(Value) value!: Value;
  @ApiProperty({ example: 'Reduzir o tempo de resposta em 30%' })
  @IsString()
  @Length(3, 200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description!: string;
  @ApiProperty() @IsBoolean() completed!: boolean;
}
export class CreateProjectDto {
  @ApiProperty({ example: 'Protocolo Vingadores' })
  @IsString()
  @Length(3, 120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;
  @ApiProperty()
  @IsString()
  @Length(10, 2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() ownerId!: string;
  @ApiPropertyOptional({ enum: ProjectStatus })
  @ValidateIf((_o, v) => v !== undefined)
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
  @ApiProperty({ type: [GoalDto], minItems: 1, maxItems: 24 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(24)
  @ValidateNested({ each: true })
  @Type(() => GoalDto)
  goals!: GoalDto[];
  @ApiPropertyOptional({ example: '2026-12-20', nullable: true })
  @ValidateIf((_o, v) => v !== undefined && v !== null)
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dueDate?: string | null;
}
export class UpdateProjectDto extends PartialType(CreateProjectDto, {
  skipNullProperties: false,
}) {}
export class ProjectQueryDto {
  @ApiPropertyOptional({ enum: ProjectStatus })
  @ValidateIf((_o, v) => v !== undefined)
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf((_o, v) => v !== undefined)
  @IsUUID()
  ownerId?: string;
  @ApiPropertyOptional()
  @ValidateIf((_o, v) => v !== undefined)
  @IsString()
  @Length(0, 120)
  search?: string;
}
