import { Entity, PrimaryColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { State } from './state.entity';

@Entity('Category')
export class Category {
  @PrimaryColumn('varchar', { length: 255 })
  id: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 255, nullable: true })
  image_path: string;

  @ManyToMany(() => State, (state) => state.categories)
  @JoinTable({
    name: 'J_Category_State',
    joinColumn: {
      name: 'categoryId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'stateId',
      referencedColumnName: 'id',
    },
  })
  states: State[];
}
