import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('SEO pages')
    .items([
      S.listItem()
        .title('Topics')
        .child(
          S.documentTypeList('blogTopic')
            .title('Topics')
            .defaultOrdering([{field: 'order', direction: 'asc'}])
            .child(async (topicId) => {
              const topic = await S.context.getClient({apiVersion: '2026-10-12'}).fetch(
                '*[_id == $id][0]{title, "slug": slug.current}',
                {id: topicId},
              )
              return S.documentList()
                .title(topic?.title || 'Posts')
                .filter('_type == "blogPost" && topic._ref == $topicId')
                .params({topicId})
                .defaultOrdering([{field: 'title', direction: 'asc'}])
                .initialValueTemplates([
                  S.initialValueTemplateItem('post-in-topic', {topicId}),
                ])
                .child((postId) => S.document().schemaType('blogPost').documentId(postId))
            }),
        ),
      S.divider(),
      S.documentTypeListItem('blogTopic').title('All topics'),
      S.documentTypeListItem('blogPost').title('All posts'),
    ])
