/**
 * 更新个人资料 API
 *
 * PUT /api/auth/profile
 *
 * 请求头：Authorization: Bearer <token>
 * 请求体：{ nickname?, avatar?, birthday?, gender?, bio? }
 * 返回：{ success: true, user: User }
 *
 * 仅允许更新 nickname / avatar / birthday / gender / bio 字段。
 * phone / wechatId / id / createdAt 不可修改。
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { userStore } from '@/lib/user-store';
import type { User } from '@/types';

/** 允许更新的字段白名单 */
const ALLOWED_FIELDS: (keyof User)[] = [
  'nickname',
  'avatar',
  'birthday',
  'gender',
  'bio',
];

/** 合法的性别取值 */
const VALID_GENDERS: Array<NonNullable<User['gender']>> = [
  'male',
  'female',
  'other',
];

/** 生日格式：YYYY-MM-DD */
const BIRTHDAY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * PUT /api/auth/profile
 */
export async function PUT(
  request: NextRequest
): Promise<
  NextResponse<
    | { success: true; user: User }
    | { success: false; error: string }
  >
> {
  try {
    // ===== 鉴权 =====
    const currentUser = getAuthUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: '未登录或登录已过期' },
        { status: 401 }
      );
    }

    // ===== 解析请求体 =====
    const body = (await request.json()) as Partial<User>;

    // ===== 字段校验 =====
    const updateData: Partial<User> = {};

    // 昵称
    if (body.nickname !== undefined) {
      const nickname = body.nickname.trim();
      if (nickname.length === 0 || nickname.length > 20) {
        return NextResponse.json(
          { success: false, error: '昵称长度需在 1-20 个字符之间' },
          { status: 400 }
        );
      }
      updateData.nickname = nickname;
    }

    // 头像
    if (body.avatar !== undefined) {
      updateData.avatar = body.avatar.trim();
    }

    // 生日
    if (body.birthday !== undefined) {
      if (body.birthday && !BIRTHDAY_REGEX.test(body.birthday)) {
        return NextResponse.json(
          { success: false, error: '生日格式应为 YYYY-MM-DD' },
          { status: 400 }
        );
      }
      updateData.birthday = body.birthday || undefined;
    }

    // 性别
    if (body.gender !== undefined) {
      if (body.gender && !VALID_GENDERS.includes(body.gender)) {
        return NextResponse.json(
          { success: false, error: '性别取值不合法' },
          { status: 400 }
        );
      }
      updateData.gender = body.gender || undefined;
    }

    // 个人简介
    if (body.bio !== undefined) {
      if (body.bio.length > 200) {
        return NextResponse.json(
          { success: false, error: '个人简介不能超过 200 个字符' },
          { status: 400 }
        );
      }
      updateData.bio = body.bio;
    }

    // 过滤掉不在白名单中的字段（防御性编程）
    for (const key of Object.keys(updateData) as (keyof User)[]) {
      if (!ALLOWED_FIELDS.includes(key)) {
        delete updateData[key];
      }
    }

    // ===== 更新用户资料 =====
    const updatedUser = userStore.updateProfile(currentUser.id, updateData);
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('[Auth Profile API] 更新个人资料失败：', error);
    return NextResponse.json(
      { success: false, error: '更新个人资料失败' },
      { status: 500 }
    );
  }
}
