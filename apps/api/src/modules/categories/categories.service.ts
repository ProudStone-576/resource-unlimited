import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';

@Injectable()
export class CategoriesService {
  constructor(private readonly repo: CategoriesRepository) {}

  list() {
    return this.repo.findAllTree();
  }

  async getBySlug(slug: string) {
    const cat = await this.repo.findBySlug(slug);
    if (!cat) throw new NotFoundException(`Category "${slug}" not found`);
    return cat;
  }
}
