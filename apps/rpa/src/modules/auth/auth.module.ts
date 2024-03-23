import { JwtStrategy } from '@/common/strategies/jwt.strategy';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: 'kndvoewovewmoimempqomgieqmvgiongmvironmvirmv',
      }),
    }),
    PassportModule,
  ],
  providers: [JwtStrategy],
})
export class AuthModule {}
