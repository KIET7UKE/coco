import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'CoCo Blog',
  projectId: 'qnyzl4ai',
  dataset: 'production',
  plugins: [structureTool({structure})],
  schema: {types: schemaTypes},
  document: {
    newDocumentOptions: (prev, {creationContext}) => {
      if (creationContext.type === 'structure') {
        return prev.filter((template) => template.templateId !== 'blogPost')
      }
      return prev
    },
  },
  templates: (prev) => [
    ...prev,
    {
      id: 'post-in-topic',
      title: 'Post',
      schemaType: 'blogPost',
      parameters: [{name: 'topicId', type: 'string'}],
      value: ({topicId}: {topicId: string}) => ({
        topic: {_type: 'reference', _ref: topicId},
        publishedAt: new Date().toISOString(),
      }),
    },
  ],
})
