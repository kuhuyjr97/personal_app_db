import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

type JWTPayload = {
  scope: 'agency' | 'gtn';
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('appsmith.secret'),
    });
  }

  async validate(payload: JWTPayload) {
    const scope = payload.scope;
    if (!scope || (scope !== 'agency' && scope !== 'gtn')) {
      throw new ForbiddenException();
    }

    return { scope };
  }
}
