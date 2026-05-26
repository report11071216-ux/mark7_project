policyname,cmd,qual,with_check
Authenticated users can create posts,INSERT,null,(auth.uid() = author_id)
Public posts visible to all,SELECT,"((guild_id IS NULL) OR (guild_id IN ( SELECT guild_members.guild_id
   FROM guild_members
  WHERE (guild_members.user_id = auth.uid()))))",null
Users can delete own posts,DELETE,(auth.uid() = author_id),null
Users can update own posts,UPDATE,(auth.uid() = author_id),null
