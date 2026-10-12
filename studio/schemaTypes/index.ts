import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {TagIcon} from '@sanity/icons/Tag'

const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'SEO title',
      type: 'string',
      description: 'Shown in search results. Aim for 70 characters or fewer.',
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: 'description',
      title: 'SEO description',
      type: 'text',
      rows: 3,
      description: 'Shown in search results. Aim for 160 characters or fewer.',
      validation: (rule) => rule.max(160),
    }),
  ],
})

const blogTopic = defineType({
  name: 'blogTopic',
  title: 'Topic',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Lower numbers appear first on the blog index.',
    }),
    defineField({name: 'seo', title: 'SEO', type: 'seo'}),
  ],
})

const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog post',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'topic',
      title: 'Topic',
      type: 'reference',
      to: [{type: 'blogTopic'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'path',
      title: 'Path',
      type: 'string',
      description: 'Public path: topic slug, then the post slug.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(300),
    }),
    defineField({name: 'publishedAt', title: 'Published at', type: 'datetime'}),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
          ],
          marks: {
            annotations: [
              defineArrayMember({
                name: 'link',
                title: 'Link',
                type: 'object',
                fields: [defineField({name: 'href', title: 'URL', type: 'string'})],
              }),
            ],
          },
        }),
      ],
    }),
    defineField({name: 'seo', title: 'SEO', type: 'seo'}),
  ],
  orderings: [
    {title: 'Title', name: 'titleAsc', by: [{field: 'title', direction: 'asc'}]},
    {title: 'Published', name: 'publishedDesc', by: [{field: 'publishedAt', direction: 'desc'}]},
  ],
})

export const schemaTypes = [seo, blogTopic, blogPost]
