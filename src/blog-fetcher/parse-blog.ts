import { RSSPostType } from "./type";

const MAX_DESCRIPTION_LENGTH = 1000;

export const parseBlogIntoString = ({
  blogPosts,
}: {
  blogPosts: RSSPostType[];
}) => `
${blogPosts
    .map(
      (blog, index) => `
### 글 ${index + 1}
- 제목: ${blog.title}
- 작성자: ${blog.author}
- 설명: ${blog.description.slice(0, MAX_DESCRIPTION_LENGTH)}
- 링크: ${blog.link}
`
    )
    .join("\n")}
`;
