import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from './userRole.entity';

@Entity('User')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: 0 })
  roleId: number;

  @Column({ unique: true })
  subId: string;

  @ManyToOne(() => UserRole, (role) => role.users)
  role: UserRole;
}
