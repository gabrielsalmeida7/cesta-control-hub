import React from 'react';
import { View, Text, Linking } from 'react-native';

function SectionTitle({ children }: { children: string }) {
  return <Text className="mb-2 text-lg font-bold text-foreground">{children}</Text>;
}

function SubTitle({ children }: { children: string }) {
  return <Text className="mb-2 mt-3 text-base font-semibold text-foreground">{children}</Text>;
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <Text className="mb-2 text-sm leading-6 text-muted-foreground">{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View className="mb-1 flex-row gap-2 pl-2">
      <Text className="text-sm text-muted-foreground">•</Text>
      <Text className="flex-1 text-sm leading-6 text-muted-foreground">{children}</Text>
    </View>
  );
}

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <Text className="text-sm text-primary underline" onPress={() => Linking.openURL(href)}>
      {children}
    </Text>
  );
}

export function PrivacyPolicyContent() {
  const lastUpdated = new Date().toLocaleDateString('pt-BR');

  return (
    <View className="gap-4">
      <Text className="text-center text-2xl font-bold text-primary">
        Política de Privacidade e Proteção de Dados
      </Text>
      <Text className="text-center text-xs text-muted-foreground">
        Última atualização: {lastUpdated}
      </Text>
      <Text className="text-center text-xs font-semibold text-foreground">
        Em conformidade com a Lei nº 13.709/2018 (LGPD)
      </Text>

      <View className="gap-2">
        <SectionTitle>1. Introdução</SectionTitle>
        <Paragraph>
          O <Text className="font-semibold text-foreground">Cesta Justa</Text> é um sistema de gestão
          de distribuição de cestas básicas comprometido com a proteção e privacidade dos dados
          pessoais dos titulares. Esta Política descreve como coletamos, usamos, armazenamos e
          protegemos suas informações pessoais.
        </Paragraph>
      </View>

      <View className="gap-1">
        <SectionTitle>2. Dados Pessoais Coletados</SectionTitle>
        <SubTitle>2.1. Famílias Beneficiárias</SubTitle>
        <Bullet>
          <Text className="font-semibold text-foreground">Dados de identificação:</Text> Nome
          completo, CPF, endereço, telefone
        </Bullet>
        <Bullet>
          <Text className="font-semibold text-foreground">Dados familiares:</Text> Nome da pessoa de
          contato, número de membros da família
        </Bullet>
        <Bullet>
          <Text className="font-semibold text-foreground">Dados de histórico:</Text> Datas de
          entregas, períodos de bloqueio, instituição atendente
        </Bullet>
        <Bullet>
          <Text className="font-semibold text-foreground">Observações:</Text> Notas sobre entregas
          (quando aplicável)
        </Bullet>

        <SubTitle>2.2. Usuários do Sistema</SubTitle>
        <Bullet>
          <Text className="font-semibold text-foreground">Dados de autenticação:</Text> Email, senha
          (criptografada)
        </Bullet>
        <Bullet>
          <Text className="font-semibold text-foreground">Dados profissionais:</Text> Nome completo,
          função (administrador/instituição), instituição vinculada
        </Bullet>
        <Bullet>
          <Text className="font-semibold text-foreground">Dados de auditoria:</Text> Registros de
          ações realizadas no sistema
        </Bullet>

        <SubTitle>2.3. Instituições Parceiras</SubTitle>
        <Bullet>
          <Text className="font-semibold text-foreground">Dados cadastrais:</Text> Nome, endereço,
          telefone
        </Bullet>
        <Bullet>
          <Text className="font-semibold text-foreground">Dados operacionais:</Text> Famílias
          atendidas, entregas realizadas
        </Bullet>
      </View>

      <View className="gap-1">
        <SectionTitle>3. Finalidades do Tratamento de Dados</SectionTitle>
        <Paragraph>Seus dados pessoais são coletados e tratados para as seguintes finalidades:</Paragraph>
        <Bullet>
          <Text className="font-semibold text-foreground">Gestão de distribuição:</Text> Cadastro e
          identificação das famílias beneficiárias
        </Bullet>
        <Bullet>
          <Text className="font-semibold text-foreground">Controle de entregas:</Text> Registro de
          entregas e prevenção de duplicidade de benefícios
        </Bullet>
        <Bullet>
          <Text className="font-semibold text-foreground">Bloqueio temporário:</Text> Garantir
          distribuição equitativa entre as famílias
        </Bullet>
        <Bullet>
          <Text className="font-semibold text-foreground">Relatórios estatísticos:</Text> Análise de
          impacto e efetividade do programa
        </Bullet>
        <Bullet>
          <Text className="font-semibold text-foreground">Geração de recibos:</Text> Comprovação de
          entrega de cestas básicas
        </Bullet>
        <Bullet>
          <Text className="font-semibold text-foreground">Obrigações legais:</Text> Atendimento a
          requisições de órgãos públicos
        </Bullet>
        <Bullet>
          <Text className="font-semibold text-foreground">Políticas públicas:</Text> Assistência
          social e combate à insegurança alimentar
        </Bullet>
      </View>

      <View className="gap-1">
        <SectionTitle>4. Bases Legais (Art. 7º da LGPD)</SectionTitle>
        <Bullet>
          <Text className="font-semibold text-foreground">Consentimento (Art. 7º, I):</Text> Mediante
          sua autorização expressa
        </Bullet>
        <Bullet>
          <Text className="font-semibold text-foreground">Execução de políticas públicas (Art. 7º, III):</Text>{' '}
          Distribuição de cestas básicas como política de assistência social
        </Bullet>
        <Bullet>
          <Text className="font-semibold text-foreground">Proteção da vida (Art. 7º, VII):</Text>{' '}
          Garantir alimentação adequada
        </Bullet>
        <Bullet>
          <Text className="font-semibold text-foreground">Tutela da saúde (Art. 7º, VIII):</Text>{' '}
          Nutrição e segurança alimentar
        </Bullet>
      </View>

      <View className="gap-1">
        <SectionTitle>5. Compartilhamento de Dados</SectionTitle>
        <Bullet>
          <Text className="font-semibold text-foreground">Instituições parceiras:</Text> Para
          coordenação da distribuição de cestas básicas
        </Bullet>
        <Bullet>
          <Text className="font-semibold text-foreground">Autoridades públicas:</Text> Quando exigido
          por lei ou determinação judicial
        </Bullet>
        <Bullet>
          <Text className="font-semibold text-foreground">Órgãos de controle:</Text> Para fiscalização
          e auditoria de políticas públicas
        </Bullet>
        <Paragraph>
          <Text className="font-semibold text-foreground">Importante:</Text> Não vendemos, alugamos ou
          compartilhamos seus dados pessoais com terceiros para fins comerciais ou publicitários.
        </Paragraph>
      </View>

      <View className="gap-1">
        <SectionTitle>6. Seus Direitos como Titular (Art. 18 da LGPD)</SectionTitle>
        <Bullet>Confirmação da existência de tratamento</Bullet>
        <Bullet>Acesso aos dados pessoais</Bullet>
        <Bullet>Correção de dados incompletos, inexatos ou desatualizados</Bullet>
        <Bullet>Anonimização, bloqueio ou eliminação de dados desnecessários</Bullet>
        <Bullet>Portabilidade dos dados</Bullet>
        <Bullet>Eliminação de dados tratados com consentimento</Bullet>
        <Bullet>Informação sobre compartilhamento</Bullet>
        <Bullet>Informação sobre consequências da negativa de consentimento</Bullet>
        <Bullet>Revogação do consentimento a qualquer momento</Bullet>
      </View>

      <View className="gap-1">
        <SectionTitle>7. Segurança e Proteção de Dados</SectionTitle>
        <Bullet>Criptografia de dados sensíveis como CPF</Bullet>
        <Bullet>Controle de acesso por perfil (admin/instituição)</Bullet>
        <Bullet>Row Level Security (RLS) no banco de dados</Bullet>
        <Bullet>Senhas protegidas com hash bcrypt</Bullet>
        <Bullet>Armazenamento seguro de documentos em buckets privados</Bullet>
        <Bullet>Logs de auditoria de operações críticas</Bullet>
        <Bullet>Backups regulares contra perda de dados</Bullet>
      </View>

      <View className="gap-1">
        <SectionTitle>8. Retenção de Dados</SectionTitle>
        <Paragraph>
          Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir as finalidades
          descritas, ou conforme exigido por lei.
        </Paragraph>
        <Bullet>
          <Text className="font-semibold text-foreground">Dados cadastrais:</Text> Enquanto houver
          vínculo ativo com o programa
        </Bullet>
        <Bullet>
          <Text className="font-semibold text-foreground">Histórico de entregas:</Text> 5 anos após
          última entrega
        </Bullet>
        <Bullet>
          <Text className="font-semibold text-foreground">Dados anonimizados:</Text> Podem ser mantidos
          indefinidamente para fins estatísticos
        </Bullet>
      </View>

      <View className="gap-1 rounded-lg bg-primary/10 p-4">
        <SectionTitle>9. Encarregado de Proteção de Dados (DPO)</SectionTitle>
        <Paragraph>
          Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de seus dados pessoais:
        </Paragraph>
        <Paragraph>
          <Text className="font-semibold text-foreground">Email:</Text> dpo@cestacontrolhub.com.br
        </Paragraph>
        <Paragraph>
          <Text className="font-semibold text-foreground">Telefone:</Text> (34) 99999-0000
        </Paragraph>
        <Paragraph>
          <Text className="font-semibold text-foreground">Prazo de resposta:</Text> até 15 dias úteis
        </Paragraph>
      </View>

      <View className="gap-1">
        <SectionTitle>10. Comunicação de Incidentes de Segurança</SectionTitle>
        <Paragraph>
          Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares,
          comunicaremos o ocorrido à ANPD e aos titulares afetados, conforme Art. 48 da LGPD.
        </Paragraph>
      </View>

      <View className="gap-1">
        <SectionTitle>11. Alterações nesta Política</SectionTitle>
        <Paragraph>
          Esta Política pode ser atualizada periodicamente para refletir mudanças em nossas práticas ou
          na legislação. Recomendamos revisar esta página regularmente.
        </Paragraph>
      </View>

      <View className="gap-1">
        <SectionTitle>12. Legislação Aplicável</SectionTitle>
        <Paragraph>
          Esta Política é regida pela legislação brasileira, em especial pela Lei nº 13.709/2018
          (LGPD) e pela Lei nº 12.965/2014 (Marco Civil da Internet).
        </Paragraph>
      </View>

      <View className="gap-2 rounded-lg bg-muted/40 p-4">
        <SectionTitle>Links Úteis</SectionTitle>
        <Paragraph>
          <Text className="font-semibold text-foreground">ANPD:</Text>{' '}
          <ExternalLink href="https://www.gov.br/anpd">www.gov.br/anpd</ExternalLink>
        </Paragraph>
        <Paragraph>
          <Text className="font-semibold text-foreground">Texto completo da LGPD:</Text>{' '}
          <ExternalLink href="http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm">
            Lei nº 13.709/2018
          </ExternalLink>
        </Paragraph>
      </View>

      <Text className="border-t border-border pt-4 text-center text-xs italic text-muted-foreground">
        Ao utilizar o sistema Cesta Control Hub e fornecer seus dados pessoais, você declara ter
        lido, compreendido e concordado com esta Política de Privacidade.
      </Text>
    </View>
  );
}
