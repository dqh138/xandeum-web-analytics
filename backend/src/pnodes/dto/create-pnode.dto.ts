import { IsString, IsNumber, IsOptional, IsEnum, IsNotEmpty, IsBoolean } from 'class-validator';

export class CreatePNodeDto {
  @IsString()
  @IsNotEmpty()
  nodeId: string; // pubkey

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsEnum(['online', 'offline', 'degraded'])
  status?: string;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @IsOptional()
  @IsNumber()
  last_seen_timestamp?: number;

  @IsOptional()
  @IsNumber()
  rpc_port?: number;

  @IsOptional()
  @IsNumber()
  storage_committed?: number;

  @IsOptional()
  @IsNumber()
  storage_usage_percent?: number;

  @IsOptional()
  @IsNumber()
  storage_used?: number;

  @IsOptional()
  @IsNumber()
  uptime?: number;

  @IsOptional()
  @IsString()
  version?: string;
}
