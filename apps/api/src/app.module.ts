import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { envValidation } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { ContactModule } from './modules/contact/contact.module';
import { MailModule } from './modules/mail/mail.module';
import { SecurityModule } from './modules/security/security.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminQuotesModule } from './modules/admin-quotes/admin-quotes.module';
import { PortalModule } from './modules/portal/portal.module';
import { AuditModule } from './modules/audit/audit.module';
import { AdminCmsModule } from './modules/admin/admin-cms.module';
import { PublicCmsModule } from './modules/public-cms/public-cms.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { CrmModule } from './modules/crm/crm.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { AdminAnalyticsController } from './modules/admin/admin-analytics/admin-analytics.controller';
import { AdminAnalyticsService } from './modules/admin/admin-analytics/admin-analytics.service';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: envValidation,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'global',
            ttl: Number(config.get('THROTTLE_TTL') ?? 60) * 1000,
            limit: Number(config.get('THROTTLE_LIMIT') ?? 20),
          },
          {
            name: 'quote',
            ttl: Number(config.get('QUOTE_THROTTLE_TTL') ?? 3600) * 1000,
            limit: Number(config.get('QUOTE_THROTTLE_LIMIT') ?? 5),
          },
        ],
      }),
    }),
    PrismaModule,
    MailModule,
    SecurityModule,
    AuthModule,
    HealthModule,
    CategoriesModule,
    ProductsModule,
    QuotesModule,
    AdminQuotesModule,
    PortalModule,
    AuditModule,
    AdminCmsModule,
    PublicCmsModule,
    WebhooksModule,
    CrmModule,
    NewsletterModule,
    ContactModule,
  ],
  controllers: [AdminAnalyticsController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    AdminAnalyticsService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
