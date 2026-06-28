import { Module } from '@nestjs/common';
import { PublicContentController } from '../public-content/public-content.controller';
import { PublicPromotionsController } from '../public-promotions/public-promotions.controller';

@Module({
  controllers: [PublicContentController, PublicPromotionsController],
})
export class PublicCmsModule {}
